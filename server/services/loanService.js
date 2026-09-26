import { db } from '../db.js';
import {
  ANNUAL_INTEREST_RATE,
  calculateForeclosureSettlement,
  generateEmiSchedule,
  todayIsoDate
} from '../domain/emi.js';

export async function createLoan({ memberId, principal, tenure, disbursedOn = todayIsoDate() }) {
  const memberResult = await db.execute({
    sql: 'SELECT id FROM members WHERE id = ?',
    args: [memberId]
  });
  if (!memberResult.rows[0]) throw serviceError(404, 'Member not found.');

  let calculation;
  try {
    calculation = generateEmiSchedule({ principal, tenure, disbursedOn });
  } catch (error) {
    throw serviceError(400, error.message);
  }

  const transaction = await db.transaction('write');
  let loanId;
  try {
    const result = await transaction.execute({
      sql: `INSERT INTO loans (
        member_id, principal, tenure, annual_interest_rate,
        disbursed_on, regular_emi, outstanding_balance
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        memberId,
        principal,
        tenure,
        ANNUAL_INTEREST_RATE,
        disbursedOn,
        calculation.regularEmi,
        principal
      ]
    });

    loanId = Number(result.lastInsertRowid);

    await transaction.batch(calculation.schedule.map((row) => ({
      sql: `INSERT INTO emi_schedule (
        loan_id, installment_number, due_date, emi_amount,
        principal_component, interest_component, outstanding_after
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        loanId,
        row.installmentNumber,
        row.dueDate,
        row.emiAmount,
        row.principalComponent,
        row.interestComponent,
        row.outstandingAfter
      ]
    })));

    await transaction.commit();
  } catch (error) {
    if (!transaction.closed) await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }

  return getLoanById(loanId);
}

export async function listLoans() {
  const result = await db.execute(`
    SELECT
      l.id,
      l.member_id,
      m.name AS member_name,
      m.member_code,
      l.principal,
      l.tenure,
      l.annual_interest_rate,
      l.disbursed_on,
      l.regular_emi,
      l.outstanding_balance,
      l.paid_installments,
      l.status,
      l.closure_type,
      l.foreclosure_settlement,
      l.closed_at,
      l.created_at
    FROM loans l
    JOIN members m ON m.id = l.member_id
    ORDER BY l.id DESC
  `);

  return result.rows.map(mapLoan);
}

export async function getLoanById(loanId) {
  const [loanResult, scheduleResult] = await Promise.all([
    db.execute({
      sql: `SELECT
        l.id,
        l.member_id,
        m.name AS member_name,
        m.member_code,
        m.monthly_salary,
        l.principal,
        l.tenure,
        l.annual_interest_rate,
        l.disbursed_on,
        l.regular_emi,
        l.outstanding_balance,
        l.paid_installments,
        l.status,
        l.closure_type,
        l.foreclosure_settlement,
        l.closed_at,
        l.created_at
      FROM loans l
      JOIN members m ON m.id = l.member_id
      WHERE l.id = ?`,
      args: [loanId]
    }),
    db.execute({
      sql: `SELECT
        installment_number,
        due_date,
        emi_amount,
        principal_component,
        interest_component,
        outstanding_after,
        status,
        paid_at
      FROM emi_schedule
      WHERE loan_id = ?
      ORDER BY installment_number`,
      args: [loanId]
    })
  ]);

  const row = loanResult.rows[0];
  if (!row) throw serviceError(404, 'Loan not found.');

  return {
    ...mapLoan(row),
    member: {
      id: Number(row.member_id),
      name: row.member_name,
      memberCode: row.member_code,
      monthlySalary: Number(row.monthly_salary)
    },
    schedule: scheduleResult.rows.map(mapScheduleRow)
  };
}

export async function payNextInstallment(loanId) {
  const loanResult = await db.execute({ sql: 'SELECT * FROM loans WHERE id = ?', args: [loanId] });
  const loan = loanResult.rows[0];
  if (!loan) throw serviceError(404, 'Loan not found.');
  if (loan.status !== 'Active') throw serviceError(409, 'Only active loans can receive EMI payments.');

  const installmentResult = await db.execute({
    sql: `SELECT * FROM emi_schedule
      WHERE loan_id = ? AND status = 'Pending'
      ORDER BY installment_number
      LIMIT 1`,
    args: [loanId]
  });
  const nextInstallment = installmentResult.rows[0];

  if (!nextInstallment) throw serviceError(409, 'No pending EMI remains for this loan.');

  const closesLoan = Number(nextInstallment.outstanding_after) === 0;
  const now = new Date().toISOString();

  await db.batch([
    {
      sql: `UPDATE emi_schedule
        SET status = 'Paid', paid_at = ?
        WHERE id = ?`,
      args: [now, nextInstallment.id]
    },
    {
      sql: `UPDATE loans
        SET
          outstanding_balance = ?,
          paid_installments = paid_installments + 1,
          status = ?,
          closure_type = ?,
          closed_at = ?
        WHERE id = ?`,
      args: [
        nextInstallment.outstanding_after,
        closesLoan ? 'Closed' : 'Active',
        closesLoan ? 'Repaid' : null,
        closesLoan ? now : null,
        loanId
      ]
    }
  ], 'write');

  return getLoanById(loanId);
}

export async function forecloseLoan(loanId) {
  const loanResult = await db.execute({ sql: 'SELECT * FROM loans WHERE id = ?', args: [loanId] });
  const loan = loanResult.rows[0];
  if (!loan) throw serviceError(404, 'Loan not found.');
  if (loan.status !== 'Active') throw serviceError(409, 'Only active loans can be foreclosed.');

  const settlement = calculateForeclosureSettlement(Number(loan.outstanding_balance));
  const now = new Date().toISOString();

  await db.batch([
    {
      sql: `UPDATE emi_schedule
        SET status = 'Waived'
        WHERE loan_id = ? AND status = 'Pending'`,
      args: [loanId]
    },
    {
      sql: `UPDATE loans
        SET
          outstanding_balance = 0,
          status = 'Closed',
          closure_type = 'Foreclosed',
          foreclosure_settlement = ?,
          closed_at = ?
        WHERE id = ?`,
      args: [settlement.settlementAmount, now, loanId]
    }
  ], 'write');

  return {
    loan: await getLoanById(loanId),
    settlement
  };
}

export function serviceError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapLoan(row) {
  return {
    id: Number(row.id),
    memberId: Number(row.member_id),
    memberName: row.member_name,
    memberCode: row.member_code,
    principal: Number(row.principal),
    tenure: Number(row.tenure),
    annualInterestRate: Number(row.annual_interest_rate),
    disbursedOn: row.disbursed_on,
    regularEmi: Number(row.regular_emi),
    outstandingBalance: Number(row.outstanding_balance),
    paidInstallments: Number(row.paid_installments),
    status: row.status,
    closureType: row.closure_type,
    foreclosureSettlement: row.foreclosure_settlement == null ? null : Number(row.foreclosure_settlement),
    closedAt: row.closed_at,
    createdAt: row.created_at
  };
}

function mapScheduleRow(row) {
  return {
    installmentNumber: Number(row.installment_number),
    dueDate: row.due_date,
    emiAmount: Number(row.emi_amount),
    principalComponent: Number(row.principal_component),
    interestComponent: Number(row.interest_component),
    outstandingAfter: Number(row.outstanding_after),
    status: row.status,
    paidAt: row.paid_at
  };
}

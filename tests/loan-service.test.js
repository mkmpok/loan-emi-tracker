import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loan-emi-tracker-'));
process.env.DB_PATH = path.join(tempDir, 'test.db');
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;

const { db, initDb } = await import('../server/db.js');
const {
  createLoan,
  forecloseLoan,
  payNextInstallment
} = await import('../server/services/loanService.js');

await initDb();

async function createMember(code) {
  const result = await db.execute({
    sql: `INSERT INTO members (name, member_code, monthly_salary)
      VALUES (?, ?, ?)`,
    args: [`Member ${code}`, code, 50000]
  });
  return Number(result.lastInsertRowid);
}

test('loan lifecycle persists schedule, payments and full repayment correctly', async () => {
  const memberId = await createMember('TEST-001');
  let loan = await createLoan({
    memberId,
    principal: 100000,
    tenure: 12,
    disbursedOn: '2026-01-15'
  });

  assert.equal(loan.schedule.length, 12);
  assert.equal(loan.outstandingBalance, 100000);
  assert.equal(loan.status, 'Active');

  loan = await payNextInstallment(loan.id);
  assert.equal(loan.paidInstallments, 1);
  assert.equal(loan.schedule[0].status, 'Paid');
  assert.equal(loan.outstandingBalance, loan.schedule[0].outstandingAfter);

  for (let count = 1; count < 12; count += 1) {
    loan = await payNextInstallment(loan.id);
  }

  assert.equal(loan.outstandingBalance, 0);
  assert.equal(loan.status, 'Closed');
  assert.equal(loan.closureType, 'Repaid');
  assert.equal(loan.schedule.every((row) => row.status === 'Paid'), true);
});

test('foreclosure closes the loan and waives future scheduled instalments', async () => {
  const memberId = await createMember('TEST-002');
  let loan = await createLoan({
    memberId,
    principal: 75000,
    tenure: 18,
    disbursedOn: '2026-03-01'
  });

  loan = await payNextInstallment(loan.id);
  const outstandingBeforeClosure = loan.outstandingBalance;
  const result = await forecloseLoan(loan.id);

  assert.equal(result.loan.status, 'Closed');
  assert.equal(result.loan.closureType, 'Foreclosed');
  assert.equal(result.loan.outstandingBalance, 0);
  assert.ok(result.settlement.settlementAmount > outstandingBeforeClosure);
  assert.equal(result.loan.schedule[0].status, 'Paid');
  assert.equal(result.loan.schedule.slice(1).every((row) => row.status === 'Waived'), true);
});

test.after(() => {
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

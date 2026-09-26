import { Router } from 'express';
import { db } from '../db.js';
import { toCsv } from '../utils/csv.js';

export const reportsRouter = Router();

reportsRouter.get('/member-outstanding', async (_req, res, next) => {
  try {
    res.json(await getMemberOutstanding());
  } catch (error) {
    next(error);
  }
});

reportsRouter.get('/member-outstanding.csv', async (_req, res, next) => {
  try {
    const report = await getMemberOutstanding();
    const csv = toCsv(report.map((row) => ({
      'Member ID': row.memberCode,
      'Member Name': row.memberName,
      'Active Loans': row.activeLoans,
      'Outstanding (INR)': row.totalOutstanding
    })));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="member-outstanding.csv"');
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
});

async function getMemberOutstanding() {
  const result = await db.execute(`
    SELECT
      m.id AS member_id,
      m.member_code,
      m.name AS member_name,
      SUM(CASE WHEN l.status = 'Active' THEN 1 ELSE 0 END) AS active_loans,
      COALESCE(SUM(CASE WHEN l.status = 'Active' THEN l.outstanding_balance ELSE 0 END), 0) AS total_outstanding
    FROM members m
    LEFT JOIN loans l ON l.member_id = m.id
    GROUP BY m.id, m.member_code, m.name
    ORDER BY total_outstanding DESC, m.name ASC
  `);

  return result.rows.map((row) => ({
    memberId: Number(row.member_id),
    memberCode: row.member_code,
    memberName: row.member_name,
    activeLoans: Number(row.active_loans),
    totalOutstanding: Number(row.total_outstanding)
  }));
}

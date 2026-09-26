import { Router } from 'express';
import { db } from '../db.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', async (_req, res, next) => {
  try {
    const [members, activeLoans, outstandingResult, collectedResult] = await Promise.all([
      db.execute('SELECT COUNT(*) AS count FROM members'),
      db.execute("SELECT COUNT(*) AS count FROM loans WHERE status = 'Active'"),
      db.execute("SELECT COALESCE(SUM(outstanding_balance), 0) AS total FROM loans WHERE status = 'Active'"),
      db.execute(`SELECT COALESCE(SUM(principal_component), 0) AS total
        FROM emi_schedule WHERE status = 'Paid'`)
    ]);

    res.json({
      memberCount: Number(members.rows[0].count),
      activeLoanCount: Number(activeLoans.rows[0].count),
      outstanding: Number(outstandingResult.rows[0].total),
      collectedPrincipal: Number(collectedResult.rows[0].total)
    });
  } catch (error) {
    next(error);
  }
});

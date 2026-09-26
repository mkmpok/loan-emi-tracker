import { Router } from 'express';
import { db } from '../db.js';

export const membersRouter = Router();

membersRouter.get('/', async (_req, res, next) => {
  try {
    const result = await db.execute(`
      SELECT id, name, member_code, monthly_salary, created_at
      FROM members
      ORDER BY id DESC
    `);
    res.json(result.rows.map(mapMember));
  } catch (error) {
    next(error);
  }
});

membersRouter.post('/', async (req, res, next) => {
  const name = String(req.body?.name || '').trim();
  const memberCode = String(req.body?.memberCode || '').trim().toUpperCase();
  const monthlySalary = Number(req.body?.monthlySalary);

  if (!name || !memberCode) {
    return res.status(400).json({ error: 'Name and member ID are required.' });
  }

  if (!Number.isInteger(monthlySalary) || monthlySalary <= 0) {
    return res.status(400).json({ error: 'Monthly salary must be a positive whole rupee amount.' });
  }

  if (name.length > 100 || memberCode.length > 40) {
    return res.status(400).json({ error: 'Name or member ID is too long.' });
  }

  try {
    const insertResult = await db.execute({
      sql: `INSERT INTO members (name, member_code, monthly_salary)
        VALUES (?, ?, ?)`,
      args: [name, memberCode, monthlySalary]
    });

    const result = await db.execute({
      sql: `SELECT id, name, member_code, monthly_salary, created_at
        FROM members WHERE id = ?`,
      args: [Number(insertResult.lastInsertRowid)]
    });

    return res.status(201).json(mapMember(result.rows[0]));
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return res.status(409).json({ error: 'That member ID already exists.' });
    }
    return next(error);
  }
});

function isUniqueConstraint(error) {
  const message = String(error?.message || '').toUpperCase();
  return message.includes('UNIQUE') || message.includes('CONSTRAINT');
}

function mapMember(row) {
  return {
    id: Number(row.id),
    name: row.name,
    memberCode: row.member_code,
    monthlySalary: Number(row.monthly_salary),
    createdAt: row.created_at
  };
}

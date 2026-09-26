import { Router } from 'express';
import { DEMO_TOKEN } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const expectedEmail = process.env.DEMO_EMAIL || 'staff@company.com';
  const expectedPassword = process.env.DEMO_PASSWORD || 'demo123';
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (email !== expectedEmail.toLowerCase() || password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.json({
    token: DEMO_TOKEN,
    user: { name: 'Staff User', email: expectedEmail }
  });
});

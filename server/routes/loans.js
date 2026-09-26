import { Router } from 'express';
import {
  createLoan,
  forecloseLoan,
  getLoanById,
  listLoans,
  payNextInstallment
} from '../services/loanService.js';

export const loansRouter = Router();

loansRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listLoans());
  } catch (error) {
    next(error);
  }
});

loansRouter.post('/', async (req, res, next) => {
  try {
    const memberId = Number(req.body?.memberId);
    const principal = Number(req.body?.principal);
    const tenure = Number(req.body?.tenure);
    const disbursedOn = req.body?.disbursedOn ? String(req.body.disbursedOn) : undefined;

    if (!Number.isInteger(memberId) || memberId <= 0) {
      return res.status(400).json({ error: 'A valid member is required.' });
    }
    if (!Number.isInteger(principal) || principal <= 0) {
      return res.status(400).json({ error: 'Principal must be a positive whole rupee amount.' });
    }
    if (!Number.isInteger(tenure) || tenure <= 0 || tenure > 360) {
      return res.status(400).json({ error: 'Tenure must be between 1 and 360 months.' });
    }

    const loan = await createLoan({ memberId, principal, tenure, disbursedOn });
    return res.status(201).json(loan);
  } catch (error) {
    return next(error);
  }
});

loansRouter.get('/:id', async (req, res, next) => {
  try {
    return res.json(await getLoanById(parseId(req.params.id)));
  } catch (error) {
    return next(error);
  }
});

loansRouter.post('/:id/pay-next', async (req, res, next) => {
  try {
    return res.json(await payNextInstallment(parseId(req.params.id)));
  } catch (error) {
    return next(error);
  }
});

loansRouter.post('/:id/foreclose', async (req, res, next) => {
  try {
    return res.json(await forecloseLoan(parseId(req.params.id)));
  } catch (error) {
    return next(error);
  }
});

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('Invalid loan ID.');
    error.status = 400;
    throw error;
  }
  return id;
}

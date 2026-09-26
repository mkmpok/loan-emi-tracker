import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { initDb } from './db.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { loansRouter } from './routes/loans.js';
import { membersRouter } from './routes/members.js';
import { reportsRouter } from './routes/reports.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use(async (_req, _res, next) => {
  try {
    await initDb();
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/members', requireAuth, membersRouter);
app.use('/api/loans', requireAuth, loansRouter);
app.use('/api/reports', requireAuth, reportsRouter);

if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && req.accepts('html')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    return next();
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status) || 500;
  res.status(status).json({
    error: status >= 500 ? 'Unexpected server error.' : error.message
  });
});

export default app;

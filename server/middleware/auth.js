export const DEMO_TOKEN = 'demo-staff-token';

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (token !== DEMO_TOKEN) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  next();
}

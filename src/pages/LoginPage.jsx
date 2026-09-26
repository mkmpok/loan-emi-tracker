import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, getToken, saveSession } from '../lib/api.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('staff@company.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (getToken()) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      saveSession(session);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-art" aria-hidden="true">
        <div className="login-art-inner">
          <div className="big-mark">₹</div>
          <p>Reducing-balance loans,<br />made easy to inspect.</p>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="brand compact">
            <div className="brand-mark">₹</div>
            <div>
              <strong>EMI Desk</strong>
              <span>Staff workspace</span>
            </div>
          </div>

          <div className="login-heading">
            <p className="eyebrow">Welcome back</p>
            <h1>Sign in to continue</h1>
            <p>Use the demo staff account for this coding assignment.</p>
          </div>

          {error && <div className="alert error">{error}</div>}

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>

          <button className="button primary large full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="demo-credentials">
            <span>Demo credentials</span>
            <code>staff@company.com / demo123</code>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../lib/api.js';
import { formatCurrency } from '../lib/format.js';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setData).catch((err) => setError(err.message));
  }, []);

  const cards = [
    ['Total members', data?.memberCount ?? '—', 'People registered in the tracker'],
    ['Active loans', data?.activeLoanCount ?? '—', 'Loans with principal outstanding'],
    ['Outstanding', data ? formatCurrency(data.outstanding) : '—', 'Current principal still to collect'],
    ['Principal collected', data ? formatCurrency(data.collectedPrincipal) : '—', 'Principal recorded through paid EMIs']
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Loan operations"
        title="Overview"
        description="A compact view of members, active loans, and repayment progress."
        actions={<Link className="button primary" to="/loans">Create loan</Link>}
      />

      {error && <div className="alert error">{error}</div>}

      <section className="stats-grid">
        {cards.map(([label, value, helper]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{helper}</p>
          </article>
        ))}
      </section>

      <section className="two-column-grid">
        <article className="surface feature-card">
          <div>
            <p className="eyebrow">Core workflow</p>
            <h2>From member to repayment schedule</h2>
            <p>Add a member, create an 8% reducing-balance loan, then record each EMI as it is paid. Outstanding principal updates immediately.</p>
          </div>
          <div className="step-list">
            <div><span>01</span><p><strong>Add member</strong><small>Capture member ID and salary.</small></p></div>
            <div><span>02</span><p><strong>Create loan</strong><small>Generate the entire EMI schedule.</small></p></div>
            <div><span>03</span><p><strong>Track repayment</strong><small>Mark sequential instalments as paid.</small></p></div>
          </div>
        </article>

        <article className="surface formula-card">
          <p className="eyebrow">Interest model</p>
          <h2>8% reducing balance</h2>
          <div className="formula">P × r × (1 + r)<sup>n</sup><br /><span>(1 + r)<sup>n</sup> − 1</span></div>
          <p>Interest is recalculated every month on the remaining principal, so the interest component falls as the loan amortises.</p>
          <Link className="text-link" to="/loans">Open loans →</Link>
        </article>
      </section>
    </div>
  );
}

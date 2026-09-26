import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../lib/api.js';
import { formatCurrency, formatDate, formatPercent } from '../lib/format.js';

export default function LoanDetailPage() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      setLoan(await api(`/loans/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function payNext() {
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await api(`/loans/${id}/pay-next`, { method: 'POST' });
      setLoan(updated);
      setMessage('Next EMI recorded as paid. Outstanding principal was updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function foreclose() {
    if (!window.confirm('Foreclose this loan? Future interest will be waived and the remaining schedule will close.')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api(`/loans/${id}/foreclose`, { method: 'POST' });
      setLoan(result.loan);
      setMessage(`Loan foreclosed. Settlement amount: ${formatCurrency(result.settlement.settlementAmount)} (principal ${formatCurrency(result.settlement.outstandingPrincipal)} + current-month interest ${formatCurrency(result.settlement.currentMonthInterest)}).`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!loan) {
    return <div className="page"><Link className="text-link" to="/loans">← Back to loans</Link>{error ? <div className="alert error top-gap">{error}</div> : <div className="loading-card">Loading loan…</div>}</div>;
  }

  const nextPending = loan.schedule.find((row) => row.status === 'Pending');

  return (
    <div className="page">
      <Link className="back-link" to="/loans">← Back to loans</Link>
      <PageHeader
        eyebrow={`${loan.member.memberCode} · Loan #${loan.id}`}
        title={loan.member.name}
        description={`${formatCurrency(loan.principal)} over ${loan.tenure} months at ${formatPercent(loan.annualInterestRate)} p.a. reducing balance.`}
        actions={<StatusBadge status={loan.status} />}
      />

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="loan-summary-grid">
        <article className="surface balance-card">
          <span>Current outstanding principal</span>
          <strong>{formatCurrency(loan.outstandingBalance)}</strong>
          <p>{loan.paidInstallments} of {loan.tenure} instalments recorded</p>
        </article>
        <article className="surface detail-card"><span>Regular EMI</span><strong>{formatCurrency(loan.regularEmi)}</strong><p>Final EMI may vary slightly to clear whole-rupee rounding.</p></article>
        <article className="surface detail-card"><span>Next due</span><strong>{nextPending ? formatDate(nextPending.dueDate) : '—'}</strong><p>{nextPending ? `${formatCurrency(nextPending.emiAmount)} scheduled` : 'No pending instalment'}</p></article>
        <article className="surface detail-card"><span>Disbursed</span><strong>{formatDate(loan.disbursedOn)}</strong><p>{formatPercent(loan.annualInterestRate)} annual rate</p></article>
      </section>

      {loan.status === 'Active' && (
        <section className="surface actions-card">
          <div><h2>Repayment actions</h2><p>Payments are recorded sequentially so the stored outstanding balance always matches the amortisation schedule.</p></div>
          <div className="action-buttons">
            <button className="button secondary" onClick={foreclose} disabled={busy}>Foreclose loan</button>
            <button className="button primary" onClick={payNext} disabled={busy || !nextPending}>{busy ? 'Updating…' : 'Record next EMI paid'}</button>
          </div>
        </section>
      )}

      {loan.status === 'Closed' && loan.closureType && (
        <div className="alert info">
          Closed via <strong>{loan.closureType}</strong>{loan.foreclosureSettlement != null ? ` · Settlement ${formatCurrency(loan.foreclosureSettlement)}` : ''}.
        </div>
      )}

      <section className="surface table-card schedule-card">
        <div className="table-toolbar"><div><h2>EMI schedule</h2><p>Interest is recalculated on the remaining principal each month.</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Due date</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Outstanding after EMI</th><th>Status</th></tr></thead>
            <tbody>
              {loan.schedule.map((row) => (
                <tr key={row.installmentNumber} className={row.status === 'Waived' ? 'waived-row' : ''}>
                  <td>{row.installmentNumber}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td><strong>{formatCurrency(row.emiAmount)}</strong></td>
                  <td>{formatCurrency(row.principalComponent)}</td>
                  <td>{formatCurrency(row.interestComponent)}</td>
                  <td>{formatCurrency(row.outstandingAfter)}</td>
                  <td><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

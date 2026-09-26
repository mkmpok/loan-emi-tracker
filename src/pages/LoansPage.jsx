import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../lib/api.js';
import { formatCurrency, formatDate } from '../lib/format.js';

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function LoansPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ memberId: '', principal: '', tenure: '12', disbursedOn: todayLocal() });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api('/loans'), api('/members')])
      .then(([loanData, memberData]) => { setLoans(loanData); setMembers(memberData); })
      .catch((err) => setError(err.message));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const loan = await api('/loans', {
        method: 'POST',
        body: JSON.stringify({
          memberId: Number(form.memberId),
          principal: Number(form.principal),
          tenure: Number(form.tenure),
          disbursedOn: form.disbursedOn
        })
      });
      navigate(`/loans/${loan.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const filteredLoans = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return loans;
    return loans.filter((loan) =>
      loan.memberName.toLowerCase().includes(term)
      || loan.memberCode.toLowerCase().includes(term)
      || loan.status.toLowerCase().includes(term)
    );
  }, [loans, search]);

  return (
    <div className="page">
      <PageHeader eyebrow="Credit" title="Loans" description="Create fixed-rate loans and inspect repayment progress." />

      <section className="split-layout">
        <article className="surface form-card sticky-card">
          <div className="section-heading">
            <div><p className="eyebrow">8% p.a.</p><h2>Create loan</h2></div>
            <span className="rate-chip">Reducing balance</span>
          </div>

          <form className="form-stack" onSubmit={submit}>
            {error && <div className="alert error">{error}</div>}
            {members.length === 0 && <div className="alert info">Add a member before creating a loan.</div>}

            <label className="field">
              <span>Member</span>
              <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} required disabled={!members.length}>
                <option value="">Select member</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.memberCode}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Principal</span>
              <div className="input-prefix"><span>₹</span><input type="number" min="1" step="1" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} placeholder="100000" required /></div>
            </label>
            <div className="field-row">
              <label className="field"><span>Tenure (months)</span><input type="number" min="1" max="360" step="1" value={form.tenure} onChange={(e) => setForm({ ...form, tenure: e.target.value })} required /></label>
              <label className="field"><span>Disbursed on</span><input type="date" value={form.disbursedOn} onChange={(e) => setForm({ ...form, disbursedOn: e.target.value })} required /></label>
            </div>
            <button className="button primary full" type="submit" disabled={saving || !members.length}>{saving ? 'Creating…' : 'Create loan & schedule'}</button>
          </form>
        </article>

        <article className="surface table-card">
          <div className="table-toolbar">
            <div><h2>Loan book</h2><p>{loans.length} total loans</p></div>
            <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search member or status…" aria-label="Search loans" />
          </div>

          {filteredLoans.length === 0 ? (
            <EmptyState title={loans.length ? 'No matches' : 'No loans yet'} description={loans.length ? 'Try a different search term.' : 'Create the first loan using the form.'} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Member</th><th>Principal</th><th>Tenure</th><th>Outstanding</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td><strong>{loan.memberName}</strong><small className="cell-subtext">{loan.memberCode} · {formatDate(loan.disbursedOn)}</small></td>
                      <td>{formatCurrency(loan.principal)}</td>
                      <td>{loan.tenure} mo.</td>
                      <td><strong>{formatCurrency(loan.outstandingBalance)}</strong></td>
                      <td><StatusBadge status={loan.status} /></td>
                      <td className="align-right"><Link className="text-link" to={`/loans/${loan.id}`}>View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

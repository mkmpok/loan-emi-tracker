import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../lib/api.js';
import { formatCurrency, formatDate } from '../lib/format.js';

const initialForm = { name: '', memberCode: '', monthlySalary: '' };

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    try {
      setMembers(await api('/members'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const member = await api('/members', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          memberCode: form.memberCode,
          monthlySalary: Number(form.monthlySalary)
        })
      });
      setMembers((current) => [member, ...current]);
      setForm(initialForm);
      setSuccess(`${member.name} was added successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      member.name.toLowerCase().includes(term) || member.memberCode.toLowerCase().includes(term)
    );
  }, [members, search]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="People"
        title="Members"
        description="Create and manage members who can receive loans."
      />

      <section className="split-layout">
        <article className="surface form-card sticky-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">New record</p>
              <h2>Add member</h2>
            </div>
          </div>

          <form className="form-stack" onSubmit={submit}>
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <label className="field">
              <span>Full name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aarav Sharma" required maxLength={100} />
            </label>
            <label className="field">
              <span>Employee / member ID</span>
              <input value={form.memberCode} onChange={(e) => setForm({ ...form, memberCode: e.target.value })} placeholder="e.g. EMP-1042" required maxLength={40} />
            </label>
            <label className="field">
              <span>Monthly salary</span>
              <div className="input-prefix"><span>₹</span><input type="number" min="1" step="1" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} placeholder="50000" required /></div>
            </label>
            <button className="button primary full" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add member'}</button>
          </form>
        </article>

        <article className="surface table-card">
          <div className="table-toolbar">
            <div>
              <h2>All members</h2>
              <p>{members.length} total</p>
            </div>
            <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or ID…" aria-label="Search members" />
          </div>

          {filteredMembers.length === 0 ? (
            <EmptyState title={members.length ? 'No matches' : 'No members yet'} description={members.length ? 'Try a different search term.' : 'Add your first member using the form.'} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Member</th><th>Member ID</th><th>Monthly salary</th><th>Added</th></tr></thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td><div className="name-cell"><span className="mini-avatar">{member.name.slice(0, 1).toUpperCase()}</span><strong>{member.name}</strong></div></td>
                      <td><code className="code-pill">{member.memberCode}</code></td>
                      <td>{formatCurrency(member.monthlySalary)}</td>
                      <td className="muted">{formatDate(member.createdAt)}</td>
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

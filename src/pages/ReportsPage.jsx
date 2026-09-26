import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { api, downloadCsv } from '../lib/api.js';
import { formatCurrency } from '../lib/format.js';

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api('/reports/member-outstanding').then(setRows).catch((err) => setError(err.message));
  }, []);

  async function exportReport() {
    setExporting(true); setError('');
    try {
      await downloadCsv('/reports/member-outstanding.csv', 'member-outstanding.csv');
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const totalOutstanding = rows.reduce((sum, row) => sum + row.totalOutstanding, 0);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Reporting"
        title="Member-wise outstanding"
        description="Current outstanding principal aggregated across each member’s active loans."
        actions={<button className="button primary" onClick={exportReport} disabled={exporting}>{exporting ? 'Exporting…' : 'Export to CSV'}</button>}
      />

      {error && <div className="alert error">{error}</div>}

      <article className="surface report-total">
        <div><span>Portfolio outstanding</span><strong>{formatCurrency(totalOutstanding)}</strong></div>
        <p>Across {rows.reduce((sum, row) => sum + row.activeLoans, 0)} active loans</p>
      </article>

      <article className="surface table-card">
        <div className="table-toolbar"><div><h2>Outstanding by member</h2><p>Closed loans contribute ₹0 to the total.</p></div></div>
        {rows.length === 0 ? (
          <EmptyState title="No member data" description="Add members and loans to populate this report." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member ID</th><th>Member</th><th>Active loans</th><th className="align-right">Total outstanding</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.memberId}>
                    <td><code className="code-pill">{row.memberCode}</code></td>
                    <td><strong>{row.memberName}</strong></td>
                    <td>{row.activeLoans}</td>
                    <td className="align-right"><strong>{formatCurrency(row.totalOutstanding)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}

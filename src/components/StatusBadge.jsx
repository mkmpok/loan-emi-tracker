export default function StatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase();
  return <span className={`status-badge ${normalized}`}>{status}</span>;
}

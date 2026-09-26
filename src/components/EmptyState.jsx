export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◇</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

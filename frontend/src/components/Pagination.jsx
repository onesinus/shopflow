export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>

      {start > 1 && <span className="pagination-gap" aria-hidden="true">…</span>}
      {pages.map((n) => (
        <button
          key={n}
          type="button"
          className={`btn btn-outline btn-sm${n === page ? ' btn-primary' : ''}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      {end < totalPages && <span className="pagination-gap" aria-hidden="true">…</span>}

      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export default function StatusFilter({ options, value, onChange }) {
  const items = ['All', ...options]

  return (
    <div className="status-filter">
      {items.map((status) => (
        <button
          key={status}
          type="button"
          className={`status-filter__pill ${
            value === status ? 'status-filter__pill--active' : ''
          }`}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  )
}

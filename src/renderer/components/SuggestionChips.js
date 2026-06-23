export function SuggestionChips({ label, items, onSelect, disabled }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="suggestion-chips">
        {items.map((name) => (
          <button
            key={name}
            type="button"
            className="tag-pill tag-pill--add"
            disabled={disabled}
            onClick={() => onSelect(name)}
          >
            + {name}
          </button>
        ))}
      </div>
    </div>
  );
}

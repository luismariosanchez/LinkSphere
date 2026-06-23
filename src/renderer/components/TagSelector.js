import { useState } from 'react';
import { apiClient } from '../services/api.client.js';

export function TagSelector({ allTags, selectedTagIds, onChange, onTagCreated, disabled }) {
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const selectedSet = new Set(selectedTagIds);
  const availableTags = allTags.filter((tag) => !selectedSet.has(tag.id));

  function toggleTag(tagId) {
    if (selectedSet.has(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  async function handleCreateTag(event) {
    event.preventDefault();

    const name = newTagName.trim();
    if (!name) {
      return;
    }

    const exists = allTags.some(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );

    if (exists) {
      setError('Ya existe un tag con ese nombre');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const created = await apiClient.tags.create({ name });
      onChange([...selectedTagIds, created.id]);
      onTagCreated?.(created);
      setNewTagName('');
    } catch (err) {
      setError(err?.message ?? 'Error al crear tag');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="tag-selector">
      <div className="tag-selector__selected">
        {selectedTagIds.length === 0 && (
          <span className="muted">Sin tags asignados</span>
        )}
        {allTags
          .filter((tag) => selectedSet.has(tag.id))
          .map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-pill tag-pill--selected"
              onClick={() => toggleTag(tag.id)}
              disabled={disabled}
            >
              {tag.name}
              <span aria-hidden="true">×</span>
            </button>
          ))}
      </div>

      {availableTags.length > 0 && (
        <div className="tag-selector__available">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-pill tag-pill--add"
              onClick={() => toggleTag(tag.id)}
              disabled={disabled}
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}

      <form className="tag-selector__create" onSubmit={handleCreateTag}>
        <input
          type="text"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder="Crear nuevo tag…"
          disabled={disabled || creating}
        />
        <button type="submit" disabled={disabled || creating || !newTagName.trim()}>
          {creating ? '…' : 'Crear'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

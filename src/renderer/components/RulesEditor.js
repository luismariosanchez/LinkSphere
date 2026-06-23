import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/api.client.js';

function RuleRow({ rule, valueKey, valueLabel, disabled, onSave, onDelete }) {
  const [match, setMatch] = useState(rule.match);
  const [value, setValue] = useState(rule[valueKey]);

  useEffect(() => {
    setMatch(rule.match);
    setValue(rule[valueKey]);
  }, [rule, valueKey]);

  async function handleBlur() {
    if (match === rule.match && value === rule[valueKey]) {
      return;
    }

    if (!match.trim() || !value.trim()) {
      setMatch(rule.match);
      setValue(rule[valueKey]);
      return;
    }

    await onSave(rule.id, { match: match.trim(), [valueKey]: value.trim() });
  }

  return (
    <div className="rules-editor__row">
      <input
        type="text"
        className="rules-editor__input"
        placeholder="match (keyword)"
        value={match}
        disabled={disabled}
        onChange={(event) => setMatch(event.target.value)}
        onBlur={() => void handleBlur()}
      />
      <input
        type="text"
        className="rules-editor__input"
        placeholder={valueLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void handleBlur()}
      />
      <button
        type="button"
        className="btn-danger rules-editor__delete"
        disabled={disabled}
        onClick={() => void onDelete(rule.id)}
        aria-label="Eliminar regla"
      >
        ×
      </button>
    </div>
  );
}

function RuleSection({
  title,
  description,
  type,
  rules,
  valueKey,
  valueLabel,
  addPlaceholder,
  disabled,
  onChange,
  onError,
}) {
  const [newMatch, setNewMatch] = useState('');
  const [newValue, setNewValue] = useState('');

  async function handleAdd(event) {
    event.preventDefault();

    const match = newMatch.trim();
    const value = newValue.trim();

    if (!match || !value) {
      return;
    }

    try {
      const updated = await apiClient.rules.addRule(type, { match, [valueKey]: value });
      onChange(updated);
      setNewMatch('');
      setNewValue('');
    } catch (err) {
      onError?.(err?.message ?? 'Error al añadir regla');
    }
  }

  async function handleSave(id, patch) {
    try {
      const updated = await apiClient.rules.update(type, { id, ...patch });
      onChange(updated);
    } catch (err) {
      onError?.(err?.message ?? 'Error al guardar regla');
    }
  }

  async function handleDelete(id) {
    try {
      const updated = await apiClient.rules.deleteRule(type, id);
      onChange(updated);
    } catch (err) {
      onError?.(err?.message ?? 'Error al eliminar regla');
    }
  }

  return (
    <div className="rules-editor__section">
      <div className="rules-editor__section-header">
        <h3>{title}</h3>
        <p className="muted">{description}</p>
      </div>

      <div className="rules-editor__list">
        {rules.length === 0 && (
          <p className="muted rules-editor__empty">No hay reglas configuradas</p>
        )}

        {rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            valueKey={valueKey}
            valueLabel={valueLabel}
            disabled={disabled}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <form className="rules-editor__add" onSubmit={(event) => void handleAdd(event)}>
        <input
          type="text"
          className="rules-editor__input"
          placeholder="match (keyword)"
          value={newMatch}
          disabled={disabled}
          onChange={(event) => setNewMatch(event.target.value)}
        />
        <input
          type="text"
          className="rules-editor__input"
          placeholder={addPlaceholder}
          value={newValue}
          disabled={disabled}
          onChange={(event) => setNewValue(event.target.value)}
        />
        <button type="submit" className="btn-secondary" disabled={disabled}>
          Añadir regla
        </button>
      </form>
    </div>
  );
}

export function RulesEditor({ disabled = false }) {
  const [rules, setRules] = useState({ tagRules: [], folderRules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.rules.getAll();
      setRules(data);
    } catch (err) {
      setError(err?.message ?? 'Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  if (loading) {
    return <p className="muted">Cargando reglas…</p>;
  }

  return (
    <div className="rules-editor">
      {error && <p className="error">{error}</p>}

      <RuleSection
        title="Reglas de tags"
        description="Si el título o tags contienen el keyword, se sugiere el tag"
        type="tag"
        rules={rules.tagRules}
        valueKey="tag"
        valueLabel="tag"
        addPlaceholder="tag sugerido"
        disabled={disabled}
        onChange={setRules}
        onError={setError}
      />

      <RuleSection
        title="Reglas de carpetas"
        description="Si el título o tags contienen el keyword, se sugiere la carpeta"
        type="folder"
        rules={rules.folderRules}
        valueKey="folder"
        valueLabel="carpeta"
        addPlaceholder="carpeta sugerida"
        disabled={disabled}
        onChange={setRules}
        onError={setError}
      />
    </div>
  );
}

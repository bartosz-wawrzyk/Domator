import { useState, useEffect, useCallback } from 'react';
import * as mealsApi from '../../api/meals';

function ProductManager({ type }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isProtein = type === 'proteins';
  const label = isProtein ? 'Proteiny' : 'Bazy';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = isProtein
        ? await mealsApi.getProteins()
        : await mealsApi.getBases();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError(err.message || 'Błąd ładowania danych');
    } finally {
      setLoading(false);
    }
  }, [isProtein]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({ name: '', category: '' });
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        if (isProtein) {
          await mealsApi.updateProtein(editingId, formData);
        } else {
          await mealsApi.updateBase(editingId, formData);
        }
      } else {
        if (isProtein) {
          await mealsApi.createProtein(formData);
        } else {
          await mealsApi.createBase(formData);
        }
      }
      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Błąd zapisu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Usunąć element?')) return;

    try {
      if (isProtein) {
        await mealsApi.deleteProtein(id);
      } else {
        await mealsApi.deleteBase(id);
      }
      await loadData();
    } catch (err) {
      console.error(err);
      let msg = 'Błąd usuwania';

      if (err?.message) msg = err.message;
      else if (typeof err === 'string') msg = err;
      else if (err?.detail?.[0]?.msg) msg = err.detail[0].msg;

      if (msg === 'Cannot delete: Protein is used in existing meals') {
        msg = 'Nie można usunąć: proteina jest używana w istniejących daniach';
      } else if (msg === 'Cannot delete: Base type is used in existing meals') {
        msg = 'Nie można usunąć: baza jest używana w istniejących daniach';
      }

      setError(msg);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({ name: item.name, category: item.category });
  };

  return (
    <div className="tab-pane">
      <h3 style={{ color: 'white', marginBottom: '20px' }}>
        {isProtein ? '🥩' : '🍚'} {label}
      </h3>

      {error && (
        <div className="credit-message credit-error">
          {error}
        </div>
      )}

      <form className="credit-form" onSubmit={handleSubmit}>
        <div className="credit-form-fields">
          <input
            placeholder="Nazwa"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          <input
            placeholder="Kategoria"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            required
          />
        </div>

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <button
            type="submit"
            className="credit-toggle-btn"
            style={{ width: 'auto' }}
          >
            {editingId ? 'Zapisz zmiany' : `Dodaj ${label}`}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="credit-cancel-btn"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Anuluj
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div style={{ marginTop: '20px', opacity: 0.6 }}>Ładowanie danych...</div>
      ) : (
        <div
          className="loan-grid-wrapper"
          style={{ gridTemplateColumns: '1fr 1fr 100px', marginTop: '20px' }}
        >
          <div className="loan-row">
            <div className="loan-cell loan-cell-header">Nazwa</div>
            <div className="loan-cell loan-cell-header">Kategoria</div>
            <div className="loan-cell loan-cell-header">Akcje</div>
          </div>

          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="loan-row">
                <div className="loan-cell">{item.name}</div>
                <div className="loan-cell">{item.category}</div>
                <div
                  className="loan-cell"
                  style={{ display: 'flex', gap: '5px' }}
                >
                  <button
                    onClick={() => startEdit(item)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Edytuj"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Usuń"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="loan-row">
              <div
                className="loan-cell"
                style={{
                  gridColumn: 'span 3',
                  textAlign: 'center',
                  opacity: 0.5,
                }}
              >
                Brak elementów na liście.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductManager;
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
      setError(err.message || 'Błąd usuwania');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({ name: item.name, category: item.category });
  };

return (
    <div className="product-manager-section">
      <div className="modal-header" style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>{isProtein ? '🥩' : '🍚'} {label}</h3>
      </div>

      {error && <div className="meal-error-message">{error}</div>}

      <form className="planer-form" onSubmit={handleSubmit}>
        <div className="planer-form-row">
          <input
            placeholder="Nazwa (np. Kurczak, Ryż)"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            placeholder="Kategoria"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            required
          />
        </div>
        <div className="planer-form-row" style={{ marginTop: '10px', justifyContent: 'flex-start' }}>
          <button type="submit" className="planer-btn-submit">
            {editingId ? '💾 Zapisz zmiany' : `➕ Dodaj ${label}`}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="meal-cancel-btn">
              Anuluj
            </button>
          )}
        </div>
      </form>

      <div className="meal-list" style={{ marginTop: '20px' }}>
        <div className="meal-row header" style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
          <div className="meal-cell">Nazwa</div>
          <div className="meal-cell">Kategoria</div>
          <div className="meal-cell-actions">Akcje</div>
        </div>

        {loading ? (
          <div style={{ padding: '20px', opacity: 0.5 }}>Ładowanie...</div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="meal-row">
              <div className="meal-cell"><strong>{item.name}</strong></div>
              <div className="meal-cell"><span className="meal-category-tag">{item.category}</span></div>
                <div className="meal-card-actions">
                  <button className="meal-btn-secondary loan-btn-block" onClick={() => startEdit(meal)}>✏️ Edytuj</button>
                  <button className="meal-btn-danger loan-btn-block" onClick={() => handleDelete(meal.id)}>🗑️ Usuń</button>
                </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', opacity: 0.5, textAlign: 'center' }}>Brak elementów na liście.</div>
        )}
      </div>
    </div>
  );
}

export default ProductManager;
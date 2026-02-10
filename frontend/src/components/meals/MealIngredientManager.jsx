import { useState, useEffect } from 'react';
import * as mealsApi from '../../api/meals';

function MealIngredientManager() {
  const [ingredients, setIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', category: '', unit: 'g' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    const filtered = ingredients.filter(ing => 
      ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients]);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const data = await mealsApi.mealGetIngredients();
      setIngredients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await mealsApi.mealCreateIngredient(formData);
      setFormData({ name: '', category: '', unit: 'g' });
      loadIngredients();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="tab-pane">
      <h3>🥦 Słownik Składników</h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <p>Dodaj nowy składnik do bazy:</p>
          <form className="planer-form" onSubmit={handleSubmit} style={{ marginTop: '10px' }}>
            <div className="planer-form-row">
              <input
                placeholder="Nazwa (np. Mąka)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <input
                placeholder="Kategoria (np. Suche)"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              />
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
              >
                <option value="g">Gramy (g)</option>
                <option value="ml">Mililitry (ml)</option>
                <option value="szt">Sztuki (szt)</option>
                <option value="opak">Opakowania (opak)</option>
              </select>
            </div>
            <button type="submit" className="planer-btn-submit">Dodaj do słownika</button>
          </form>
        </div>

        <div className="planer-form" style={{ minWidth: '300px' }}>
          <p style={{ marginBottom: '-5px', fontSize: '0.9rem' }}>🔍 Szukaj w słowniku:</p>
          <div className="planer-form-row">
            <input 
              type="text"
              placeholder="Wpisz nazwę składnika..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {error && <div className="credit-message credit-error" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="meal-list" style={{ marginTop: '30px' }}>
        <div className="meal-row" style={{ fontWeight: 'bold', borderBottom: '1px solid #444', background: 'rgba(255,255,255,0.1)' }}>
          <div>Nazwa</div>
          <div>Kategoria</div>
          <div>Jednostka</div>
        </div>
        
        {filteredIngredients.map((ing) => (
          <div key={ing.id} className="meal-row">
            <div>{ing.name}</div>
            <div>{ing.category}</div>
            <div>{ing.unit}</div>
          </div>
        ))}

        {filteredIngredients.length === 0 && !loading && (
          <p style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>
            {searchTerm ? 'Nie znaleziono składnika o tej nazwie.' : 'Brak składników w bazie.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default MealIngredientManager;
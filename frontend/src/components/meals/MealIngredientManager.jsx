import { useState, useEffect } from 'react';
import * as mealsApi from '../../api/meals';

function MealIngredientManager() {
  const [ingredients, setIngredients] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: '', unit: 'g' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIngredients();
  }, []);

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
      <p>Dodaj składniki, które później wykorzystasz w swoich przepisach.</p>

      {error && <div className="credit-message credit-error">{error}</div>}

      <form className="planer-form" onSubmit={handleSubmit}>
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

      <div className="meal-list" style={{ marginTop: '30px' }}>
        <div className="meal-row" style={{ fontWeight: 'bold', borderBottom: '1px solid #444' }}>
          <div>Nazwa</div>
          <div>Kategoria</div>
          <div>Jednostka</div>
        </div>
        {ingredients.map((ing) => (
          <div key={ing.id} className="meal-row">
            <div>{ing.name}</div>
            <div>{ing.category}</div>
            <div>{ing.unit}</div>
          </div>
        ))}
        {ingredients.length === 0 && !loading && (
          <p style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Brak składników w bazie.</p>
        )}
      </div>
    </div>
  );
}

export default MealIngredientManager;
import { useEffect, useState } from 'react';
import * as mealsApi from '../../api/meals';

function MealManager() {
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [proteins, setProteins] = useState([]);
  const [bases, setBases] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  
  const [selectedMealForRecipe, setSelectedMealForRecipe] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    id_protein_type: '',
    id_base_type: '',
    is_weekend_dish: false,
  });

  const [recipeFormData, setRecipeFormData] = useState({
    id_ingredient: '',
    base_amount: 0,
    note: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mealsData, proteinsData, basesData, ingredientsData] = await Promise.all([
        mealsApi.getMeals(),
        mealsApi.getProteins(),
        mealsApi.getBases(),
        mealsApi.mealGetIngredients()
      ]);
      setMeals(mealsData);
      setFilteredMeals(mealsData);
      setProteins(proteinsData);
      setBases(basesData);
      setAvailableIngredients(ingredientsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Błąd ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const filtered = meals.filter(meal => 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meal.description && meal.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMeals(filtered);
  }, [searchTerm, meals]);

  const openRecipeEditor = async (meal) => {
    setSelectedMealForRecipe(meal);
    setLoading(true);
    try {
      const recipe = await mealsApi.mealGetRecipe(meal.id);
      setRecipeItems(recipe);
    } catch (err) {
      setError('Nie udało się pobrać receptury');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredientToRecipe = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...recipeFormData,
        base_amount: parseFloat(recipeFormData.base_amount) || 0
      };

      if (editingRecipeId) {
        await mealsApi.mealUpdateRecipeItem(editingRecipeId, payload);
      } else {
        await mealsApi.mealAddIngredientToMeal(selectedMealForRecipe.id, payload);
      }
      const updatedRecipe = await mealsApi.mealGetRecipe(selectedMealForRecipe.id);
      setRecipeItems(updatedRecipe);
      setRecipeFormData({ id_ingredient: '', base_amount: 0, note: '' });
      setEditingRecipeId(null);
    } catch (err) {
      setError(err.message || 'Błąd zapisu');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', id_protein_type: '', id_base_type: '', is_weekend_dish: false });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await mealsApi.updateMeal(editingId, formData);
      } else {
        await mealsApi.createMeal(formData);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || 'Błąd zapisu');
    }
  };

  const startEdit = (meal) => {
    setEditingId(meal.id);
    setFormData({
      name: meal.name,
      description: meal.description || '',
      id_protein_type: meal.id_protein_type,
      id_base_type: meal.id_base_type,
      is_weekend_dish: meal.is_weekend_dish,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Usunąć danie?')) return;
    try {
      await mealsApi.deleteMeal(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Błąd usuwania');
    }
  };

  return (
    <div className="tab-pane">
      <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>🍲 Książka Kucharska</h3>
        {!selectedMealForRecipe && (
          <input 
            type="text"
            className="planer-search-input"
            placeholder="🔍 Szukaj dania..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        )}
      </div>

      {error && <div className="meal-error-message">{error}</div>}

      {selectedMealForRecipe ? (
        <div className="recipe-editor-container">
          <div className="recipe-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0 }}>Składniki dania: <span className="highlight">{selectedMealForRecipe.name}</span></h4>
            <button className="meal-btn-secondary" onClick={() => {
              setSelectedMealForRecipe(null);
              setEditingRecipeId(null);
              setRecipeFormData({ id_ingredient: '', base_amount: 0, note: '' });
            }}>
              Powrót do listy ⮕
            </button>
          </div>

          <form className="planer-form" onSubmit={handleAddIngredientToRecipe}>
            <div className="planer-form-row">
              <select
                value={recipeFormData.id_ingredient}
                onChange={(e) => setRecipeFormData(p => ({ ...p, id_ingredient: e.target.value }))}
                disabled={!!editingRecipeId}
                required
              >
                <option value="">— wybierz składnik —</option>
                {availableIngredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Ilość (na osobę)"
                value={recipeFormData.base_amount}
                onChange={(e) => setRecipeFormData(p => ({ ...p, base_amount: e.target.value }))}
                required
              />
              <input
                placeholder="Notatka (opcjonalnie)"
                value={recipeFormData.note}
                onChange={(e) => setRecipeFormData(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <div className="planer-form-row" style={{ marginTop: '10px', justifyContent: 'flex-start', gap: '10px' }}>
              <button className="planer-btn-submit" type="submit">
                {editingRecipeId ? '💾 Zapisz zmiany' : '➕ Dodaj składnik'}
              </button>
              {editingRecipeId && (
                <button type="button" className="meal-cancel-btn" onClick={() => {
                  setEditingRecipeId(null);
                  setRecipeFormData({ id_ingredient: '', base_amount: 0, note: '' });
                }}>Anuluj</button>
              )}
            </div>
          </form>

          <div className="meal-list" style={{ marginTop: '20px' }}>
            {recipeItems.map(item => (
              <div key={item.id} className="meal-row">
                <div className="meal-cell">
                  <strong>{item.ingredient.name}</strong>
                  <div className="meal-info"><span>{item.base_amount} {item.ingredient.unit} / os.</span></div>
                </div>
                <div className="meal-cell">{item.note}</div>
                <div className="meal-card-actions">
                  <button className="meal-btn-secondary loan-btn-block" onClick={() => {
                     setEditingRecipeId(item.id);
                     setRecipeFormData({ id_ingredient: item.ingredient.id, base_amount: item.base_amount, note: item.note || '' });
                  }}>✏️ Edytuj</button>
                  <button className="meal-btn-danger loan-btn-block" onClick={() => { if(window.confirm('Usunąć?')) mealsApi.mealDeleteRecipeItem(item.id).then(() => openRecipeEditor(selectedMealForRecipe)) }}>🗑️ Usuń</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <form className="planer-form" onSubmit={handleSubmit}>
            <div className="planer-form-row">
              <input
                placeholder="Nazwa dania"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                required
                style={{ flex: 2 }}
              />
              <select
                value={formData.id_protein_type}
                onChange={(e) => setFormData(p => ({ ...p, id_protein_type: e.target.value }))}
                required
                style={{ flex: 1 }}
              >
                <option value="">— Białko —</option>
                {proteins.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                value={formData.id_base_type}
                onChange={(e) => setFormData(p => ({ ...p, id_base_type: e.target.value }))}
                required
                style={{ flex: 1 }}
              >
                <option value="">— Baza —</option>
                {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            
            <textarea
              placeholder="Opis / przygotowanie"
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              rows="2"
              style={{ marginTop: '10px', width: '100%' }}
            />

            <div style={{ marginTop: '10px' }}>
              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={formData.is_weekend_dish}
                  onChange={(e) => setFormData(p => ({ ...p, is_weekend_dish: e.target.checked }))}
                />
                🏠 Danie weekendowe
              </label>
            </div>

            <div className="planer-form-row" style={{ marginTop: '15px', justifyContent: 'flex-start', gap: '10px' }}>
              <button className="planer-btn-submit" type="submit">
                {editingId ? '💾 Zapisz zmiany' : '➕ Dodaj danie'}
              </button>
              {editingId && <button type="button" className="meal-cancel-btn" onClick={resetForm}>Anuluj</button>}
            </div>
          </form>

          <div className="meal-list" style={{ marginTop: '30px' }}>
            <div className="meal-row header">
              <div className="meal-cell">Danie / Skład</div>
              <div className="meal-cell">Opis</div>
              <div className="meal-cell-actions">Akcje</div>
            </div>

            {filteredMeals.map(meal => (
              <div key={meal.id} className="meal-row" style={{ alignItems: 'center' }}>
                <div className="meal-cell">
                  <strong>{meal.name} {meal.is_weekend_dish && '🏠'}</strong>
                  <div className="meal-info" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <span className="info-tag" style={{ background: 'rgba(37, 117, 252, 0.2)', color: '#7eb1ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {meal.protein_type?.name || 'Brak białka'}
                    </span>
                    <span className="info-tag" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {meal.base_type?.name || 'Brak bazy'}
                    </span>
                  </div>
                </div>
                <div className="meal-cell description-cell" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                  {meal.description}
                </div>
                <div className="meal-card-actions">
                  <button className="meal-btn-primary loan-btn-block" onClick={() => openRecipeEditor(meal)}>📝 Składniki</button>
                  <button className="meal-btn-secondary loan-btn-block" onClick={() => startEdit(meal)}>✏️ Edytuj</button>
                  <button className="meal-btn-danger loan-btn-block" onClick={() => handleDelete(meal.id)}>🗑️ Usuń</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default MealManager;
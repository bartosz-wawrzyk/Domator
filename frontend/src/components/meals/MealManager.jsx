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
      console.error(err);
      setError(err.message || 'Błąd ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const startEditRecipe = (item) => {
    setEditingRecipeId(item.id);
    setRecipeFormData({
      id_ingredient: item.ingredient.id,
      base_amount: item.base_amount,
      note: item.note || ''
    });
  };

  const handleAddIngredientToRecipe = async (e) => {
    e.preventDefault();
    try {
      if (editingRecipeId) {
        await mealsApi.mealUpdateRecipeItem(editingRecipeId, recipeFormData);
      } else {
        await mealsApi.mealAddIngredientToMeal(selectedMealForRecipe.id, recipeFormData);
      }

      const updatedRecipe = await mealsApi.mealGetRecipe(selectedMealForRecipe.id);
      setRecipeItems(updatedRecipe);
      
      setRecipeFormData({ id_ingredient: '', base_amount: 0, note: '' });
      setEditingRecipeId(null);
    } catch (err) {
      setError(err.message || 'Błąd zapisu składnika w recepturze');
    }
  };

  const handleDeleteRecipeItem = async (recipeId) => {
    if (!window.confirm('Usunąć składnik z tego dania?')) return;
    try {
      await mealsApi.mealDeleteRecipeItem(recipeId);
      setRecipeItems(prev => prev.filter(item => item.id !== recipeId));
    } catch (err) {
      setError('Błąd podczas usuwania składnika');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      id_protein_type: '',
      id_base_type: '',
      is_weekend_dish: false,
    });
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
      setError(err.message || 'Błąd zapisu dania');
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
      <h3>🍲 Dania</h3>

      {error && <div className="credit-message credit-error">{error}</div>}

      {selectedMealForRecipe ? (
        <div className="recipe-editor">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4>Składniki dla: <strong>{selectedMealForRecipe.name}</strong></h4>
            <button className="meal-cancel-btn" onClick={() => {
              setSelectedMealForRecipe(null);
              setEditingRecipeId(null);
              setRecipeFormData({ id_ingredient: '', base_amount: 0, note: '' });
            }}>
              Powrót do listy dań
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'rgba(255, 152, 0, 0.1)', 
            borderLeft: '5px solid #ff9800', 
            padding: '12px', 
            marginBottom: '20px',
            borderRadius: '4px',
            color: '#ff9800',
            fontSize: '0.9rem'
          }}>
            <strong>⚖️ Zasada ilości bazowej:</strong> Wpisuj ilość potrzebną na <strong>1 osobę / 1 posiłek</strong>. 
            Gotowanie na więcej osób lub dni automatycznie przeliczy te wartości.
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
                placeholder="Ilość (na 1 osobę)"
                value={recipeFormData.base_amount}
                onChange={(e) => setRecipeFormData(p => ({ ...p, base_amount: parseFloat(e.target.value) || 0 }))}
                required
              />
              <input
                placeholder="Notatka (np. drobno posiekać)"
                value={recipeFormData.note}
                onChange={(e) => setRecipeFormData(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="planer-btn-submit" type="submit">
                {editingRecipeId ? 'Zapisz zmiany' : 'Dodaj składnik'}
              </button>
              {editingRecipeId && (
                <button type="button" className="meal-cancel-btn" onClick={() => {
                  setEditingRecipeId(null);
                  setRecipeFormData({ id_ingredient: '', base_amount: 0, note: '' });
                }}>
                  Anuluj
                </button>
              )}
            </div>
          </form>

          <div className="meal-list" style={{ marginTop: '20px' }}>
            {recipeItems.map(item => (
              <div key={item.id} className="meal-row">
                <div className="meal-cell">
                  <strong>{item.ingredient.name}</strong>
                  <small>{item.base_amount} {item.ingredient.unit} (na osobę)</small>
                </div>
                <div className="meal-cell">{item.note}</div>
                <div className="meal-cell-actions">
                  <button title="Edytuj ilość" onClick={() => startEditRecipe(item)}>✏️</button>
                  <button title="Usuń z receptury" onClick={() => handleDeleteRecipeItem(item.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {recipeItems.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5 }}>To danie nie ma jeszcze składników.</p>}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px', marginBottom: '30px' }}>
            
            <div style={{ width: '100%' }}>
              <p>Dodaj lub edytuj podstawowe dane o daniu:</p>
              <form className="planer-form" onSubmit={handleSubmit}>
                <input
                  placeholder="Nazwa dania"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                />
                <textarea
                  placeholder="Krótki opis lub sposób przygotowania"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                />
                <div className="planer-form-row">
                  <select
                    value={formData.id_protein_type}
                    onChange={(e) => setFormData(p => ({ ...p, id_protein_type: e.target.value }))}
                    required
                  >
                    <option value="">— wybierz białko —</option>
                    {proteins.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                  <select
                    value={formData.id_base_type}
                    onChange={(e) => setFormData(p => ({ ...p, id_base_type: e.target.value }))}
                    required
                  >
                    <option value="">— wybierz bazę —</option>
                    {bases.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.category})</option>
                    ))}
                  </select>
                </div>
                
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.is_weekend_dish}
                    onChange={(e) => setFormData(p => ({ ...p, is_weekend_dish: e.target.checked }))}
                  />
                  Danie weekendowe
                </label>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '10px',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="planer-btn-submit" type="submit">
                      {editingId ? 'Zaktualizuj danie' : 'Utwórz nowe danie'}
                    </button>
                    {editingId && <button type="button" className="meal-cancel-btn" onClick={resetForm}>Anuluj</button>}
                  </div>
                </div>
              </form>
            </div>

            <div className="planer-form" style={{ flex: '1', minWidth: '250px' }}>
              <p>🔍 Szukaj w swoich daniach:</p>
              <div className="planer-form-row">
                <input 
                  type="text"
                  placeholder="Wpisz nazwę dania..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="meal-list">
            <div className="meal-row" style={{ fontWeight: 'bold', borderBottom: '1px solid #444', background: 'rgba(255,255,255,0.05)' }}>
              <div>Danie / Baza</div>
              <div>Opis</div>
              <div style={{ textAlign: 'right' }}>Akcje</div>
            </div>

            {filteredMeals.map(meal => (
              <div key={meal.id} className="meal-row">
                <div className="meal-cell">
                  <strong>{meal.name} {meal.is_weekend_dish && '🏠'}</strong>
                  <small>{meal.protein_type?.name} + {meal.base_type?.name}</small>
                </div>
                <div className="meal-cell" style={{ fontSize: '0.9em' }}>
                  {meal.description || <span style={{ opacity: 0.3 }}>Brak opisu</span>}
                </div>
                <div className="meal-cell-actions">
                  <button title="Składniki i przepis" onClick={() => openRecipeEditor(meal)}>📝</button>
                  <button title="Edytuj" onClick={() => startEdit(meal)}>✏️</button>
                  <button title="Usuń" onClick={() => handleDelete(meal.id)}>🗑️</button>
                </div>
              </div>
            ))}

            {filteredMeals.length === 0 && !loading && (
              <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                {searchTerm ? 'Brak dań pasujących do wyszukiwania.' : 'Twoja książka kucharska jest jeszcze pusta.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MealManager;
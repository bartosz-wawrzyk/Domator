import { useState, useEffect } from 'react';
import * as mealsApi from '../../api/meals';

function MealSettingsManager() {
  const [settings, setSettings] = useState({
    default_servings: 1,
    scale_by_two_days: false,
    shopping_day_of_week: 1,
    shopping_list_days_range: 1,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await mealsApi.getMealSettings();
      setSettings(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mealsApi.updateMealSettings(settings);
      setMessage({ type: 'success', text: 'Ustawienia zapisane pomyślnie!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDefaults = async () => {
    if (!window.confirm('Czy na pewno chcesz wygenerować startowy zestaw dań?')) return;
    
    setLoading(true);
    try {
      const response = await mealsApi.setupDefaultMeals();
      
      if (response.status === 'skipped') {
        setMessage({ 
          type: 'warning', 
          text: 'Operacja pominięta: Posiadasz już bazę dań w swoim profilu.' 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: '🚀 Sukces! Wygenerowano 20 domyślnych dań z poprawnymi porcjami.' 
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyle = () => {
    const styles = {
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '20px',
      color: '#fff',
      border: '1px solid'
    };

    if (message.type === 'error') {
      return { ...styles, background: 'rgba(255,0,0,0.2)', borderColor: 'red' };
    }
    if (message.type === 'warning') {
      return { ...styles, background: 'rgba(255,165,0,0.2)', borderColor: 'orange' };
    }
    return { ...styles, background: 'rgba(0,255,0,0.1)', borderColor: '#42e695' };
  };

  return (
    <div className="tab-pane">
      <h3>⚙️ Konfiguracja Planera</h3>
      <p>Dostosuj parametry generowania planu i list zakupów.</p>

      {message.text && (
        <div style={getMessageStyle()}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="planer-form">
        <div className="planer-form-row">
          <div className="meal-cell">
            <label>Domyślna liczba porcji</label>
            <input 
              type="number" 
              value={settings.default_servings}
              onChange={(e) => setSettings({...settings, default_servings: parseInt(e.target.value)})}
            />
          </div>
          <div className="meal-cell">
            <label>Dzień zakupów (1-7)</label>
            <select 
              value={settings.shopping_day_of_week}
              onChange={(e) => setSettings({...settings, shopping_day_of_week: parseInt(e.target.value)})}
            >
              <option value={1}>Poniedziałek</option>
              <option value={2}>Wtorek</option>
              <option value={3}>Środa</option>
              <option value={4}>Czwartek</option>
              <option value={5}>Piątek</option>
              <option value={6}>Sobota</option>
              <option value={7}>Niedziela</option>
            </select>
          </div>
        </div>

        <div className="checkbox-row">
          <label className="custom-checkbox">
            <input 
              type="checkbox" 
              checked={settings.scale_by_two_days}
              onChange={(e) => setSettings({...settings, scale_by_two_days: e.target.checked})}
            />
            Skaluj posiłki na 2 dni
          </label>
        </div>

        <button type="submit" className="planer-btn-submit" disabled={loading}>
          {loading ? 'Przetwarzanie...' : 'Zapisz ustawienia'}
        </button>
      </form>

      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <h4>Akcje zaawansowane</h4>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
          Jeśli Twoje konto jest nowe, możesz wygenerować przykładową bazę danych (20 dań).
        </p>
        <button 
          onClick={handleSetupDefaults}
          className="sub-nav-btn"
          style={{ 
            marginTop: '10px', 
            borderColor: loading ? '#666' : '#2575fc',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          {loading ? '⌛ Generowanie...' : '🚀 Generuj dane startowe'}
        </button>
      </div>
    </div>
  );
}

export default MealSettingsManager;
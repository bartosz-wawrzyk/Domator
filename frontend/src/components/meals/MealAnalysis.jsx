import { useState, useEffect } from 'react';
import * as mealsApi from '../../api/meals';

function MealAnalysis() {
  const [shoppingDate, setShoppingDate] = useState('');
  const [config, setConfig] = useState(null);
  const [shoppingList, setShoppingList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadSettingsAndCalculateDate();
  }, []);

  const loadSettingsAndCalculateDate = async () => {
    try {
      const settings = await mealsApi.getMealSettings();
      setConfig(settings);
      const nextDate = getNextAllowedDate(new Date(), settings.shopping_day_of_week);
      setShoppingDate(nextDate);
    } catch (err) {
      setError("Nie udało się pobrać konfiguracji.");
    }
  };

  const getNextAllowedDate = (baseDate, targetDayOfWeek) => {
    const date = new Date(baseDate);
    const currentDay = date.getDay() || 7;
    let diff = targetDayOfWeek - currentDay;
    if (diff < 0) diff += 7;
    date.setDate(date.getDate() + diff);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e) => {
    const selected = e.target.value;
    if (!config) return;

    const dateObj = new Date(selected);
    const dayOfWeek = dateObj.getDay() || 7;

    if (dayOfWeek !== config.shopping_day_of_week) {
      const corrected = getNextAllowedDate(dateObj, config.shopping_day_of_week);
      setShoppingDate(corrected);
      alert(`Zgodnie z Twoją konfiguracją, zakupy robisz w ${getDayName(config.shopping_day_of_week)}. Data została skorygowana.`);
    } else {
      setShoppingDate(selected);
    }
  };

  const getDayName = (dayNum) => {
    const names = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
    return names[dayNum - 1];
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const shoppingDateObj = new Date(shoppingDate);
      shoppingDateObj.setDate(shoppingDateObj.getDate() + 1);
      const mealsFrom = shoppingDateObj.toISOString().split('T')[0];

      const data = await mealsApi.getShoppingList(mealsFrom);
      setShoppingList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = shoppingList.items
      .map(item => `• ${item.name}: ${item.amount.toFixed(2)} ${item.unit}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="tab-pane">
      <h3>🛒 Generator Listy Zakupów</h3>
      
      <div className="planer-form-row" style={{ alignItems: 'flex-end', marginBottom: '25px', gap: '15px' }}>
        <div>
          <label>Dzień zakupów ({config ? getDayName(config.shopping_day_of_week) : '...'}):</label>
          <input 
            type="date" 
            value={shoppingDate} 
            onChange={handleDateChange}
            className="planer-input"
            style={{ border: '1px solid #42e695' }}
          />
        </div>
        <button className="planer-btn-submit" onClick={fetchAnalysis} disabled={loading || !shoppingDate}>
          {loading ? 'Generowanie...' : 'Generuj listę'}
        </button>
      </div>

      {shoppingList && (
        <div className="analysis-container" style={{ maxWidth: '500px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(66, 230, 149, 0.1)', borderRadius: '8px', border: '1px solid #42e695', marginBottom: '15px' }}>
            <p style={{ margin: '0 0 5px 0' }}>📦 Dzień zakupów: <strong>{shoppingDate}</strong></p>
            <p style={{ margin: 0, color: '#42e695' }}>🍴 Posiłki od: <strong>{shoppingList.start_date}</strong> do <strong>{shoppingList.end_date}</strong></p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <button onClick={copyToClipboard} className="planer-btn-submit" style={{ backgroundColor: copySuccess ? '#2e7d32' : '#444' }}>
              {copySuccess ? '✅ Skopiowano' : '📋 Kopiuj listę'}
            </button>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '15px', color: '#333' }}>
            {shoppingList.items.map((item, idx) => (
              <div key={idx} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                • <strong>{item.name}</strong>: {item.amount.toFixed(2)} {item.unit}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MealAnalysis;
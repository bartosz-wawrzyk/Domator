import { useEffect, useState } from 'react';
import * as mealsApi from '../../api/meals';

function MealPlannerManager() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState([]);
  const [simpleMeals, setSimpleMeals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayDetails, setDayDetails] = useState(null);
  
  const [proposal, setProposal] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);

  const [formData, setFormData] = useState({
    meal_id: '',
    is_out_of_home: false,
    note: '',
    is_two_days: false
  });

  const loadData = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const [plan, meals] = await Promise.all([
        mealsApi.getMonthPlan(year, month),
        mealsApi.getSimpleMeals()
      ]);
      setMonthData(plan.days || []);
      setSimpleMeals(meals);
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => { loadData(); }, [currentDate]);

  const handleGenerateClick = async (e, dateStr) => {
    e.stopPropagation();
    try {
      const data = await mealsApi.generateWeeklyProposal(dateStr);
      setProposal(data);
      setShowProposalModal(true);
    } catch (err) { alert(err.message); }
  };

  const handleSaveProposal = async () => {
    try {
      await mealsApi.acceptProposal(proposal);
      setShowProposalModal(false);
      setProposal(null);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const updateProposalItem = (index, field, value) => {
    const newProposal = [...proposal];
    newProposal[index] = { ...newProposal[index], [field]: value };
    
    if (field === 'meal_id') {
      const meal = simpleMeals.find(m => m.id === value);
      newProposal[index].meal_name = meal ? meal.name : '';
    }
    
    setProposal(newProposal);
  };

  const removeFromProposal = (index) => {
    const newProposal = proposal.filter((_, i) => i !== index);
    setProposal(newProposal);
  };

  const openDayDetails = (dateStr) => {
    const existing = monthData.find(d => d.date === dateStr);
    setSelectedDate(dateStr);
    setDayDetails(existing || null);
    setFormData({
      meal_id: existing?.meal_id || '',
      is_out_of_home: existing?.is_out_of_home || false,
      note: existing?.note || '',
      is_two_days: false
    });
    setShowForm(true);
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!formData.meal_id && !formData.is_out_of_home) {
      alert("Wybierz danie lub zaznacz opcję 'Poza domem'");
      return;
    }
    try {
      const payload = { ...formData, meal_id: formData.meal_id === '' ? null : formData.meal_id, meal_date: selectedDate };
      await mealsApi.addMealToPlan(payload);
      setShowForm(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteDay = async () => {
    const msg = dayDetails?.is_two_days ? "Ten posiłek jest zaplanowany na 2 dni. Usunąć oba?" : `Usunąć plan z ${selectedDate}?`;
    if (!window.confirm(msg)) return;
    try {
      await mealsApi.deleteDayPlan(selectedDate);
      setShowForm(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteWeek = async (e, dateStr) => {
    e.stopPropagation();
    if (!window.confirm(`Wyczyścić tydzień od ${dateStr}?`)) return;
    try {
      await mealsApi.deleteWeekPlan(dateStr);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;

    const cells = [];
    for (let i = 0; i < startingDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isMonday = new Date(year, month, day).getDay() === 1;
      const dayEntry = monthData.find(d => d.date === dateStr);
      
      cells.push(
        <div key={day} className={`calendar-day ${dayEntry ? 'has-meal' : ''}`} onClick={() => openDayDetails(dateStr)}>
          <div className="day-header">
            <span className="day-number">{day}</span>
            {isMonday && (
              <div className="day-actions-mini">
                <button className="generate-week-btn" onClick={(e) => handleGenerateClick(e, dateStr)} title="Generuj tydzień">🪄</button>
                <button className="delete-week-badge" onClick={(e) => handleDeleteWeek(e, dateStr)} title="Czyść tydzień">🗑️</button>
              </div>
            )}
          </div>
          {dayEntry && (
            <div className={`meal-badge ${dayEntry.is_out_of_home ? 'out' : ''}`}>
              <span className="meal-name">
                {dayEntry.meal_name || (dayEntry.is_out_of_home ? "🍽️ Poza domem" : "Brak nazwy")}
              </span>
              {dayEntry.meal_name && (
                <div className="meal-info">
                  <span>{dayEntry.protein_type}</span>
                  <span>{dayEntry.base_type}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="tab-pane">
      <div className="modal-header">
        <h3>🗓️ Harmonogram Posiłków</h3>
        <div className="calendar-nav">
          <button className="sub-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>◀</button>
          <span className="current-month-display">
            {new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(currentDate)}
          </span>
          <button className="sub-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>▶</button>
        </div>
      </div>

      <div className="calendar-grid">
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(d => (
          <div key={d} className="weekday-label">{d}</div>
        ))}
        {renderCalendar()}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="planer-content modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h4 style={{ margin: 0 }}>Plan: {selectedDate}</h4>
              {dayDetails && <button type="button" className="meal-delete-btn" onClick={handleDeleteDay}>Usuń plan</button>}
            </div>
            
            <form onSubmit={handleAddMeal} className="planer-form">
              <div className="planer-form-row">
                <select 
                   value={formData.meal_id || ''} 
                   onChange={e => setFormData({...formData, meal_id: e.target.value})}
                   disabled={formData.is_out_of_home}
                >
                  <option value="">-- wybierz danie --</option>
                  {simpleMeals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <textarea 
                placeholder="Notatka (np. przygotować rano...)" 
                value={formData.note} 
                onChange={e => setFormData({...formData, note: e.target.value})}
                rows="2"
              />

              <div className="checkbox-row">
                <label className="custom-checkbox">
                  <input type="checkbox" checked={formData.is_two_days} onChange={e => setFormData({...formData, is_two_days: e.target.checked})}/>
                  🥘 Na 2 dni
                </label>
                <label className="custom-checkbox">
                  <input type="checkbox" checked={formData.is_out_of_home} onChange={e => setFormData({...formData, is_out_of_home: e.target.checked})}/>
                  🍽️ Poza domem
                </label>
              </div>

              <div className="planer-form-row" style={{ marginTop: '10px' }}>
                <button type="submit" className="planer-btn-submit">Zatwierdź</button>
                <button type="button" className="meal-cancel-btn" onClick={() => setShowForm(false)}>Anuluj</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProposalModal && proposal && (
        <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
          <div className="planer-content modal-content proposal-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3>🪄 Propozycja automatyczna</h3>
              <button className="meal-cancel-btn" onClick={() => setShowProposalModal(false)}>Zamknij</button>
            </div>
            
            <div className="meal-list" style={{ marginTop: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {proposal.map((item, index) => (
                <div key={index} className="meal-row">
                  <div className="meal-cell" style={{ flex: '0 0 110px' }}>
                    <strong>{item.meal_date}</strong>
                  </div>
                  
                  <div className="meal-cell">
                    <div className="planer-form" style={{ padding: 0, background: 'none', border: 'none', margin: 0 }}>
                      <select 
                        value={item.meal_id || ''} 
                        onChange={(e) => updateProposalItem(index, 'meal_id', e.target.value)}
                        style={{ padding: '6px' }}
                      >
                        <option value="">-- wybierz danie --</option>
                        {simpleMeals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="meal-cell" style={{ flex: '0 0 80px' }}>
                    <label className="custom-checkbox" style={{ fontSize: '0.8rem' }}>
                      <input 
                        type="checkbox" 
                        checked={item.is_two_days} 
                        onChange={(e) => updateProposalItem(index, 'is_two_days', e.target.checked)}
                      /> 2 dni
                    </label>
                  </div>

                  <div className="meal-cell-actions">
                    <button 
                      type="button" 
                      className="meal-action-btn" 
                      onClick={() => removeFromProposal(index)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="planer-form-row" style={{ marginTop: '25px', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="sub-nav-btn" style={{ border: '1px solid rgba(255,255,255,0.1)' }} onClick={(e) => handleGenerateClick(e, proposal[0]?.meal_date || selectedDate)}>
                🔄 Ponów
              </button>
              <button className="planer-btn-submit" onClick={handleSaveProposal}>
                💾 Zatwierdź Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlannerManager;
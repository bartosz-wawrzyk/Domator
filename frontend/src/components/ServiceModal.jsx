import { useState } from 'react';
import { deleteServiceEvent, createServiceItem, deleteServiceItem } from '../api/services';
import DeleteButton from './DeleteButton';

function ServiceModal({ services, vehicleName, onClose, onUpdate }) {
  const [activeEventId, setActiveEventId] = useState(null); 
  const [itemForm, setItemForm] = useState({ type: '', description: '', cost: '' });

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć cały wpis serwisowy wraz ze wszystkimi pozycjami?')) return;
    try {
      await deleteServiceEvent(id);
      onUpdate();
    } catch (err) {
      alert("Błąd podczas usuwania wydarzenia.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Usunąć tę pozycję?')) return;
    try {
      await deleteServiceItem(itemId);
      onUpdate(); 
    } catch (err) {
      alert("Błąd podczas usuwania pozycji.");
    }
  };

  const handleAddItem = async (eventId) => {
    if (!itemForm.type || !itemForm.cost) {
      alert("Wypełnij przynajmniej typ i koszt pozycji.");
      return;
    }

    try {
      await createServiceItem({
        service_event_id: eventId,
        type: itemForm.type,
        description: itemForm.description,
        cost: Number(itemForm.cost),
        is_recurring: false,
        interval_km: 0,
        interval_months: 0
      });
      setItemForm({ type: '', description: '', cost: '' });
      onUpdate();
    } catch (err) {
      alert("Błąd podczas dodawania pozycji.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="loan-name">Historia serwisu: {vehicleName}</div>
          <button className="modal-close-btn" onClick={onClose}>Zamknij</button>
        </div>

        <div className="payment-list">
          {!Array.isArray(services) || services.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Brak wpisów serwisowych.</p>
          ) : (
            services.map(s => (
              <div key={s.id} className="service-event-block" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '15px 0' }}>
                
                <div className="payment-row-extended">
                  <div className="payment-info">
                    <span className="payment-date">{new Date(s.service_date).toLocaleDateString()}</span>
                    <span className="payment-amount"><strong>{(s.total_cost || 0).toFixed(2)} zł</strong></span>
                    <span className="payment-type">{(s.mileage_at_service || 0).toLocaleString()} km</span>
                  </div>
                  <div className="payment-actions">
                    <button 
                      className="details-btn" 
                      onClick={() => setActiveEventId(activeEventId === s.id ? null : s.id)}
                    >
                      {activeEventId === s.id ? 'Ukryj szczegóły' : 'Pozycje / Notatki'}
                    </button>
                    <DeleteButton onClick={() => handleDeleteEvent(s.id)} />
                  </div>
                </div>

                {activeEventId === s.id && (
                  <div className="service-details-expanded" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', marginTop: '10px', borderRadius: '8px' }}>
                    
                    {s.notes && (
                      <div style={{ marginBottom: '15px', fontSize: '14px', borderLeft: '3px solid #007bff', paddingLeft: '10px' }}>
                        <strong>Notatki:</strong> {s.notes}
                      </div>
                    )}

                    <div className="items-list" style={{ marginBottom: '15px' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#007bff' }}>Wykaz części i usług:</h4>
                      {s.items && s.items.length > 0 ? (
                        s.items.map(item => (
                          <div key={item.id} className="service-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px', borderBottom: '1px dotted #444' }}>
                            <span><strong>{item.type}</strong> {item.description && `- ${item.description}`}</span>
                            <span>
                              {(item.cost || 0).toFixed(2)} zł
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                style={{ background: 'none', border: 'none', color: '#ff4d4d', marginLeft: '10px', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </span>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '12px', fontStyle: 'italic' }}>Brak dodanych pozycji.</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #444' }}>
                      <input 
                        autoFocus
                        style={{ flex: 2, minWidth: '120px' }} 
                        placeholder="Np. Olej silnikowy" 
                        value={itemForm.type} 
                        onChange={e => setItemForm({...itemForm, type: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(s.id)}
                      />
                      <input 
                        style={{ flex: 3, minWidth: '150px' }} 
                        placeholder="Opis" 
                        value={itemForm.description} 
                        onChange={e => setItemForm({...itemForm, description: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(s.id)}
                      />
                      <input 
                        style={{ width: '90px' }} 
                        type="number" 
                        placeholder="Koszt" 
                        value={itemForm.cost} 
                        onChange={e => setItemForm({...itemForm, cost: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(s.id)}
                      />
                      <button className="details-btn" style={{ padding: '5px 15px' }} onClick={() => handleAddItem(s.id)}>+</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceModal;
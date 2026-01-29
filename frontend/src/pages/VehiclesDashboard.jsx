import { useState, useEffect } from 'react';
import AddVehicleForm from '../components/AddVehicleForm';
import VehicleList from '../components/VehicleList';
import AddServiceEventForm from '../components/AddServiceEventForm';
import '../assets/styles/credit.css';

function VehiclesDashboard() {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAddService, setShowAddService] = useState(false);

  useEffect(() => {
    document.title = 'Domator – Pojazdy';
  }, []);

  function handleSuccess() {
    setRefreshTrigger(prev => prev + 1);
    setShowAddVehicle(false);
    setMessage({ text: 'Pojazd został poprawnie zapisany.', type: 'success' });
    
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }

  function handleError(msg) {
    setMessage({ text: msg, type: 'error' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      
      <div className="credits-actions">
        <button onClick={() => setShowAddVehicle(v => !v)} className="credit-toggle-btn">
          {showAddVehicle ? 'Ukryj pojazd' : 'Dodaj pojazd'}
        </button>
        {showAddVehicle && <AddVehicleForm onSuccess={() => handleSuccess()} />}

        <button onClick={() => setShowAddService(v => !v)} className="credit-toggle-btn">
          {showAddService ? 'Ukryj dodawanie serwisu' : 'Dodaj wpis serwisowy'}
        </button>
        {showAddService && <AddServiceEventForm onSuccess={() => {
            setShowAddService(false);
            handleSuccess();
          }} />}
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'credit-success credit-message' : 'credit-error credit-message'}>
          {message.text}
        </div>
      )}

      <VehicleList refreshTrigger={refreshTrigger} />
      
    </div>
  );
}

export default VehiclesDashboard;
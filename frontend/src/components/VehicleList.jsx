import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getVehicles, deleteVehicle } from '../api/vehicles';
import { getVehicleServices } from '../api/services';
import EditButton from '../components/EditButton';
import DeleteButton from '../components/DeleteButton';
import VehicleEditModal from '../components/VehicleEditModal';
import ServiceModal from '../components/ServiceModal';
import '../assets/styles/credit.css';

function VehicleList({ refreshTrigger }) {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [currentVehicle, setCurrentVehicle] = useState(null);

  const handleShowServices = async (vehicle) => {
    try {
      const response = await getVehicleServices(vehicle.id);
      setSelectedServices(response.data || []);
      setCurrentVehicle(vehicle);
      setShowServiceModal(true);
    } catch (err) {
      console.error("Błąd pobierania:", err);
    }
  };

  async function fetchVehicles() {
    if (!user) return;
    setLoading(true);
    try {
      const response = await getVehicles();
      if (!response.ok) throw new Error('Nie udało się pobrać pojazdów');
      setVehicles(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Usunąć ten pojazd?')) return;
    try {
      await deleteVehicle(id);
      fetchVehicles();
    } catch (err) {
      alert('Błąd usuwania');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user, refreshTrigger]);

  if (loading) return <p>Ładowanie...</p>;
  if (error) return <p className="credit-error">{error}</p>;

  if (vehicles.length === 0) {
    return <p style={{ color: 'white', marginTop: '20px' }}>Brak pojazdów w systemie.</p>;
  }

  return (
    <>
      <div className="loan-grid-wrapper" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        <div className="loan-cell loan-cell-header">Marka</div>
        <div className="loan-cell loan-cell-header">Model</div>
        <div className="loan-cell loan-cell-header">Nr rej.</div>
        <div className="loan-cell loan-cell-header">Przebieg</div>
        <div className="loan-cell loan-cell-header">Paliwo</div>
        <div className="loan-cell loan-cell-header">Status</div>
        <div className="loan-cell loan-cell-header">Akcje</div>

        {vehicles.map((v) => (
          <div className="loan-row" key={v.id}>
            <div className="loan-cell">{v.brand}</div>
            <div className="loan-cell">{v.model}</div>
            <div className="loan-cell">{v.registration_number}</div>
            <div className="loan-cell">{v.current_mileage} km</div>
            <div className="loan-cell">{v.fuel_type}</div>
            <div className="loan-cell">{v.is_active ? 'Aktywny' : 'Nieaktywny'}</div>
            <div className="loan-cell loan-cell-actions">
              <button 
                className="details-btn" 
                onClick={() => handleShowServices(v)}
              >
                Szczegóły
              </button>
              <EditButton onClick={() => setEditingVehicle(v)} />
              <DeleteButton onClick={() => handleDelete(v.id)} />
            </div>
          </div>
        ))}
      </div>

      {editingVehicle && (
        <VehicleEditModal 
          vehicle={editingVehicle} 
          onClose={() => setEditingVehicle(null)} 
          onSuccess={fetchVehicles} 
        />
      )}

      {showServiceModal && (
        <ServiceModal 
          services={selectedServices}
          vehicleName={`${currentVehicle.brand} ${currentVehicle.model}`}
          onClose={() => {
            setShowServiceModal(false);
            fetchVehicles();
          }}

          onUpdate={() => handleShowServices(currentVehicle)} 
        />
      )}
    </>
  );
}

export default VehicleList;
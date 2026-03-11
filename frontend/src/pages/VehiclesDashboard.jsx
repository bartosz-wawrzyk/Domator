import { useState, useEffect, useCallback } from 'react';
import VehicleForm    from '../components/vehicle/VehicleForm';
import ServiceHistory from '../components/vehicle/ServiceHistory';
import * as vehicleApi from '../api/vehicle';
import '../assets/styles/vehicle.css';

const FUEL_LABEL = {
  PETROL:   'Benzyna',
  DIESEL:   'Diesel',
  HYBRID:   'Hybryda',
  ELECTRIC: 'Elektryczny',
  LPG:      'LPG',
  CNG:      'CNG',
};

const TABS = [
  { id: 'list',    label: '🚗 Pojazdy' },
  { id: 'service', label: '🔧 Historia serwisowa' },
];

function VehiclesDashboard() {
  const [activeTab, setActiveTab]         = useState('list');
  const [vehicles, setVehicles]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alert, setAlert]                 = useState(null);

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [formMode, setFormMode] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    document.title = 'Domator – Pojazdy';
  }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const res = await vehicleApi.getVehicles();
    if (res.ok) {
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } else {
      showAlert('error', 'Nie udało się pobrać listy pojazdów.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleFormSuccess = () => {
    setFormMode(null);
    setSelectedVehicle(null);
    fetchVehicles();
    showAlert('success', formMode === 'add' ? 'Pojazd dodany.' : 'Pojazd zaktualizowany.');
  };

  const handleDeleteConfirmed = async () => {
    const res = await vehicleApi.deleteVehicle(confirmDelete.id);
    setConfirmDelete(null);
    if (res.ok) {
      if (selectedVehicle?.id === confirmDelete.id) {
        setSelectedVehicle(null);
        setActiveTab('list');
      }
      fetchVehicles();
      showAlert('success', 'Pojazd usunięty.');
    } else {
      showAlert('error', res.data?.detail || 'Nie udało się usunąć pojazdu.');
    }
  };

  const handleSelectForService = (vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveTab('service');
    setFormMode(null);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormMode('edit');
    setActiveTab('list');
  };

  const formatMileage = (val) =>
    new Intl.NumberFormat('pl-PL').format(val) + ' km';

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  if (loading) return <div className="loading">Ładowanie pojazdów...</div>;

  return (
    <div className="vehicles-container">

      <div className="vehicles-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`vehicles-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setFormMode(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="vehicles-content">

        {alert && <div className={`vehicle-alert ${alert.type}`}>{alert.msg}</div>}

        {activeTab === 'list' && (
          <>
            {formMode === 'add' && (
              <VehicleForm
                onSuccess={handleFormSuccess}
                onCancel={() => setFormMode(null)}
              />
            )}
            {formMode === 'edit' && selectedVehicle && (
              <VehicleForm
                vehicle={selectedVehicle}
                onSuccess={handleFormSuccess}
                onCancel={() => { setFormMode(null); setSelectedVehicle(null); }}
              />
            )}

            {!formMode && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  className="vehicle-btn-primary"
                  onClick={() => setFormMode('add')}
                >
                  + Dodaj pojazd
                </button>
              </div>
            )}

            {vehicles.length === 0 ? (
              <div className="vehicle-empty">
                Brak pojazdów. Dodaj pierwszy powyżej.
              </div>
            ) : (
              <div className="vehicle-list">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className={`vehicle-card ${selectedVehicle?.id === v.id ? 'selected' : ''}`}
                    onClick={() => setSelectedVehicle(v)}
                  >
                    <div className="vehicle-card-icon">
                      {v.fuel_type === 'ELECTRIC' ? '⚡' : '🚗'}
                    </div>

                    <div className="vehicle-card-info">
                      <div className="vehicle-card-title">
                        {v.brand} {v.model}
                        <span style={{ marginLeft: '10px' }}>
                          <span className={`vehicle-badge ${v.is_active ? 'active' : 'inactive'}`}>
                            {v.is_active ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </span>
                      </div>
                      <div className="vehicle-card-meta">
                        <span className="vehicle-meta-item">
                          📅 <strong>{v.production_year}</strong>
                        </span>
                        <span className="vehicle-meta-item">
                          ⛽ <strong>{FUEL_LABEL[v.fuel_type] ?? v.fuel_type}</strong>
                        </span>
                        <span className="vehicle-meta-item">
                          🔢 <strong>{v.registration_number}</strong>
                        </span>
                        <span className="vehicle-meta-item">
                          📍 Przebieg: <strong>{formatMileage(v.current_mileage)}</strong>
                        </span>
                        <span className="vehicle-meta-item">
                          🔧 Ostatni serwis: <strong>{formatDate(v.last_service_date)}</strong>
                        </span>
                      </div>
                    </div>

                    <div
                      className="vehicle-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="vehicle-btn-icon"
                        onClick={() => handleSelectForService(v)}
                        title="Historia serwisowa"
                      >
                        🔧 Serwis
                      </button>
                      <button
                        className="vehicle-btn-icon"
                        onClick={() => handleEditVehicle(v)}
                        title="Edytuj pojazd"
                      >
                        ✏️ Edytuj
                      </button>
                      <button
                        className="vehicle-btn-danger"
                        onClick={() => setConfirmDelete({ id: v.id, label: `${v.brand} ${v.model}` })}
                        title="Usuń pojazd"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'service' && (
          <>
            {!selectedVehicle ? (
              <>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '16px', fontSize: '0.88rem' }}>
                  Wybierz pojazd aby zobaczyć historię serwisową:
                </p>
                <div className="vehicle-list">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="vehicle-card"
                      onClick={() => setSelectedVehicle(v)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="vehicle-card-icon">
                        {v.fuel_type === 'ELECTRIC' ? '⚡' : '🚗'}
                      </div>
                      <div className="vehicle-card-info">
                        <div className="vehicle-card-title">{v.brand} {v.model}</div>
                        <div className="vehicle-card-meta">
                          <span className="vehicle-meta-item">
                            🔢 <strong>{v.registration_number}</strong>
                          </span>
                          <span className="vehicle-meta-item">
                            📍 <strong>{formatMileage(v.current_mileage)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  className="vehicle-btn-secondary"
                  style={{ marginBottom: '20px' }}
                  onClick={() => setSelectedVehicle(null)}
                >
                  ← Zmień pojazd
                </button>
                <ServiceHistory vehicle={selectedVehicle} />
              </>
            )}
          </>
        )}

      </div>

      {confirmDelete && (
        <div className="vehicle-confirm-overlay">
          <div className="vehicle-confirm-box">
            <h3>⚠️ Usunąć pojazd?</h3>
            <p>
              Usunięcie pojazdu <strong>{confirmDelete.label}</strong> jest nieodwracalne
              i usunie też całą historię serwisową.
            </p>
            <div className="vehicle-confirm-actions">
              <button className="vehicle-confirm-cancel" onClick={() => setConfirmDelete(null)}>
                Anuluj
              </button>
              <button className="vehicle-btn-danger" onClick={handleDeleteConfirmed}>
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default VehiclesDashboard;
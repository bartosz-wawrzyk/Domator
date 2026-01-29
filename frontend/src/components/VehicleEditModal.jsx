import { useState } from 'react';
import { updateVehicle } from '../api/vehicles';

function VehicleEditModal({ vehicle, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    brand: vehicle.brand,
    model: vehicle.model,
    production_year: vehicle.production_year,
    current_mileage: vehicle.current_mileage,
    registration_number: vehicle.registration_number,
    is_active: vehicle.is_active
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await updateVehicle(vehicle.id, formData);
      if (!response.ok) throw new Error('Błąd aktualizacji');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="loan-name">Edytuj: {vehicle.brand} {vehicle.model}</div>
          <button className="modal-close-btn" onClick={onClose}>Zamknij</button>
        </div>
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>Marka</label>
            <input type="text" name="brand" value={formData.brand} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Przebieg (km)</label>
            <input type="number" name="current_mileage" value={formData.current_mileage} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Aktywny</label>
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
          </div>
          {error && <p className="credit-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={loading}>{loading ? 'Zapisywanie...' : 'Zapisz'}</button>
            <button type="button" onClick={onClose}>Anuluj</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VehicleEditModal;
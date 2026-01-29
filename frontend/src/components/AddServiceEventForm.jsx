import { useState, useEffect } from 'react';
import { getVehicles } from '../api/vehicles';
import { createServiceEvent } from '../api/services';

function AddServiceEventForm({ onSuccess }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    vehicle_id: '',
    service_date: new Date().toISOString().slice(0, 16),
    mileage_at_service: '',
    total_cost: '',
    notes: ''
  });

  useEffect(() => {
    getVehicles().then(res => {
      setVehicles(res.data || []);
      if (res.data?.length > 0) setForm(prev => ({ ...prev, vehicle_id: res.data[0].id }));
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createServiceEvent({
        ...form,
        mileage_at_service: Number(form.mileage_at_service),
        total_cost: Number(form.total_cost),
        service_date: new Date(form.service_date).toISOString()
      });
      setSuccess('Serwis dodany!');
      setTimeout(() => {
        setSuccess(null);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Błąd zapisu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="credit-form">
      <div className="credit-form-fields" style={{ flexWrap: 'wrap', width: '100%' }}>
        <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
          <option value="">Wybierz pojazd</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.registration_number})</option>
          ))}
        </select>
        <input name="service_date" type="datetime-local" value={form.service_date} onChange={handleChange} required />
        <input name="mileage_at_service" type="number" placeholder="Przebieg przy serwisie" value={form.mileage_at_service} onChange={handleChange} required />
        <input name="total_cost" type="number" placeholder="Całkowity koszt" value={form.total_cost} onChange={handleChange} required />
        <input name="notes" placeholder="Notatki" value={form.notes} onChange={handleChange} />
      </div>

      {error && <p className="credit-message credit-error">{error}</p>}
      {success && <p className="credit-message credit-success">{success}</p>}

      <button type="submit" disabled={loading}>{loading ? 'Zapisywanie...' : 'Zapisz serwis'}</button>
    </form>
  );
}

export default AddServiceEventForm;
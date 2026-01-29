import { useState } from 'react';
import { createVehicle } from '../api/vehicles';
import '../assets/styles/credit.css';

function AddVehicleForm({ onSuccess }) {
  const [form, setForm] = useState({
    brand: '',
    model: '',
    production_year: '',
    vin: '',
    registration_number: '',
    fuel_type: 'Benzyna',
    current_mileage: '',
    last_service_date: new Date().toISOString().split('T')[0],
    last_service_mileage: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await createVehicle({
        ...form,
        production_year: Number(form.production_year),
        current_mileage: Number(form.current_mileage),
        last_service_mileage: Number(form.last_service_mileage),
        last_service_date: new Date(form.last_service_date).toISOString()
      });

      setSuccess('Pojazd został dodany pomyślnie!');
      setForm({
        brand: '', model: '', production_year: '', vin: '',
        registration_number: '', fuel_type: 'Benzyna',
        current_mileage: '', last_service_date: '', last_service_mileage: 0
      });

      setTimeout(() => {
        setSuccess(null);
        onSuccess?.();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Błąd dodawania pojazdu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="credit-form">
      <div className="credit-form-fields" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}>
        <input name="brand" placeholder="Marka" value={form.brand} onChange={handleChange} required />
        <input name="model" placeholder="Model" value={form.model} onChange={handleChange} required />
        <input name="production_year" type="number" placeholder="Rok produkcji" value={form.production_year} onChange={handleChange} required />
        <input name="vin" placeholder="VIN" value={form.vin} onChange={handleChange} required />
        <input name="registration_number" placeholder="Nr rejestracyjny" value={form.registration_number} onChange={handleChange} required />
        <select name="fuel_type" value={form.fuel_type} onChange={handleChange}>
          <option value="Benzyna">Benzyna</option>
          <option value="Diesel">Diesel</option>
          <option value="LPG">LPG</option>
          <option value="Hybryda">Hybryda</option>
          <option value="Elektryczny">Elektryczny</option>
        </select>
        <input name="current_mileage" type="number" placeholder="Przebieg" value={form.current_mileage} onChange={handleChange} required />
      </div>

      {error && <p className="credit-message credit-error">{error}</p>}
      {success && <p className="credit-message credit-success">{success}</p>}

      <button type="submit" disabled={loading}>{loading ? 'Zapisywanie...' : 'Zapisz pojazd'}</button>
    </form>
  );
}

export default AddVehicleForm;
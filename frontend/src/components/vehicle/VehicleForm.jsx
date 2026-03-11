import { useState, useEffect } from 'react';
import * as vehicleApi from '../../api/vehicle';

const FUEL_TYPES = [
  { label: 'Benzyna',       value: 'PETROL' },
  { label: 'Diesel',        value: 'DIESEL' },
  { label: 'Hybryda',       value: 'HYBRID' },
  { label: 'Elektryczny',   value: 'ELECTRIC' },
  { label: 'LPG',           value: 'LPG' },
  { label: 'CNG',           value: 'CNG' },
];

const EMPTY_FORM = {
  brand: '',
  model: '',
  production_year: '',
  vin: '',
  registration_number: '',
  fuel_type: 'PETROL',
  current_mileage: '',
  last_service_date: '',
  last_service_mileage: '',
};

function VehicleForm({ vehicle = null, onSuccess, onCancel }) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const isEdit = Boolean(vehicle);

  useEffect(() => {
    if (vehicle) {
      setForm({
        brand:               vehicle.brand ?? '',
        model:               vehicle.model ?? '',
        production_year:     vehicle.production_year ?? '',
        vin:                 vehicle.vin ?? '',
        registration_number: vehicle.registration_number ?? '',
        fuel_type:           vehicle.fuel_type ?? 'PETROL',
        current_mileage:     vehicle.current_mileage ?? '',
        last_service_date:   vehicle.last_service_date
                               ? vehicle.last_service_date.split('T')[0]
                               : '',
        last_service_mileage: vehicle.last_service_mileage ?? '',
      });
    }
  }, [vehicle]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const validate = () => {
    if (!form.brand.trim())               return 'Marka jest wymagana.';
    if (!form.model.trim())               return 'Model jest wymagany.';
    if (!form.production_year)            return 'Rok produkcji jest wymagany.';
    if (form.vin.length !== 17)           return 'VIN musi mieć dokładnie 17 znaków.';
    if (!form.registration_number.trim()) return 'Numer rejestracyjny jest wymagany.';
    if (form.current_mileage === '')      return 'Przebieg jest wymagany.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);

    const payload = {
      brand:               form.brand.trim(),
      model:               form.model.trim(),
      production_year:     Number(form.production_year),
      vin:                 form.vin.trim().toUpperCase(),
      registration_number: form.registration_number.trim().toUpperCase(),
      fuel_type:           form.fuel_type,
      current_mileage:     Number(form.current_mileage),
      last_service_date:   form.last_service_date
                             ? new Date(form.last_service_date).toISOString()
                             : null,
      last_service_mileage: form.last_service_mileage !== ''
                             ? Number(form.last_service_mileage)
                             : null,
    };

    const res = isEdit
      ? await vehicleApi.updateVehicle(vehicle.id, payload)
      : await vehicleApi.createVehicle(payload);

    setLoading(false);

    if (res.ok) {
      onSuccess?.();
    } else {
      setError(res.data?.detail || 'Nie udało się zapisać pojazdu.');
    }
  };

  return (
    <div className="vehicle-form">
      <p className="vehicle-form-title">
        {isEdit ? '✏️ Edycja pojazdu' : '🚗 Nowy pojazd'}
      </p>

      {error && <div className="vehicle-alert error">{error}</div>}

      <div className="vehicle-form-grid">
        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Marka</label>
          <input className="vehicle-input" name="brand" value={form.brand}
            onChange={handleChange} placeholder="np. BMW" />
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Model</label>
          <input className="vehicle-input" name="model" value={form.model}
            onChange={handleChange} placeholder="np. X5" />
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Rok produkcji</label>
          <input className="vehicle-input" type="number" name="production_year"
            value={form.production_year} onChange={handleChange}
            placeholder="np. 2018" min="1900" max={new Date().getFullYear()} />
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Rodzaj paliwa</label>
          <select className="vehicle-select" name="fuel_type"
            value={form.fuel_type} onChange={handleChange}>
            {FUEL_TYPES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">VIN (17 znaków)</label>
          <input className="vehicle-input" name="vin" value={form.vin}
            onChange={handleChange} placeholder="np. WBAFR9C50BC123456"
            maxLength={17} style={{ textTransform: 'uppercase' }} />
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Nr rejestracyjny</label>
          <input className="vehicle-input" name="registration_number"
            value={form.registration_number} onChange={handleChange}
            placeholder="np. WA12345" style={{ textTransform: 'uppercase' }} />
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Aktualny przebieg (km)</label>
          <input className="vehicle-input" type="number" name="current_mileage"
            value={form.current_mileage} onChange={handleChange}
            placeholder="np. 120000" min="0" />
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Data ostatniego serwisu</label>
          <input className="vehicle-input" type="date" name="last_service_date"
            value={form.last_service_date} onChange={handleChange} />
        </div>

        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Przebieg przy ostatnim serwisie</label>
          <input className="vehicle-input" type="number" name="last_service_mileage"
            value={form.last_service_mileage} onChange={handleChange}
            placeholder="np. 115000" min="0" />
        </div>
      </div>

      <div className="vehicle-form-actions">
        <button className="vehicle-btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj pojazd'}
        </button>
        <button className="vehicle-btn-secondary" onClick={onCancel}>
          Anuluj
        </button>
      </div>
    </div>
  );
}

export default VehicleForm;
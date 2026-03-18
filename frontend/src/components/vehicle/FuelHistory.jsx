import { useState, useEffect, useCallback } from 'react';
import * as vehicleApi from '../../api/vehicle';

const FUEL_TYPES = ['PETROL', 'DIESEL', 'LPG', 'CNG', 'ELECTRIC', 'HYBRID'];

const FUEL_LABEL = {
  PETROL:   'Benzyna',
  DIESEL:   'Diesel',
  LPG:      'LPG',
  CNG:      'CNG',
  ELECTRIC: 'Elektryczny',
  HYBRID:   'Hybryda',
};

const EMPTY_FORM = {
  date:            '',
  mileage:         '',
  fuel_type:       'PETROL',
  liters:          '',
  price_per_liter: '',
  total_price:     '',
  is_full:         true,
};

function FuelHistory({ vehicle }) {
  const [logs, setLogs]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alert, setAlert]                 = useState(null);

  const [showForm, setShowForm]           = useState(false);
  const [editingLog, setEditingLog]       = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);

  const [consumption, setConsumption]     = useState(null);
  const [consumptionMsg, setConsumptionMsg] = useState(null);
  const [consumptionLoading, setConsumptionLoading] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState(
    vehicle.fuel_type ?? 'PETROL'
  );

  const [confirmDelete, setConfirmDelete] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  const formatCost = (val) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val ?? 0);

  const formatMileage = (val) =>
    new Intl.NumberFormat('pl-PL').format(val) + ' km';

  const toDatetimeLocal = (iso) => (iso ? iso.slice(0, 16) : '');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await vehicleApi.getFuelLogs(vehicle.id);
    if (res.ok) {
      setLogs(Array.isArray(res.data) ? res.data : []);
    } else {
      showAlert('error', 'Nie udało się pobrać historii tankowań.');
    }
    setLoading(false);
  }, [vehicle.id]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const fetchConsumption = useCallback(async () => {
    setConsumptionLoading(true);
    setConsumption(null);
    setConsumptionMsg(null);

    const res = await vehicleApi.getFuelConsumption(vehicle.id, selectedFuelType);

    if (res.ok) {
        if (res.data?.message) {
        const CONSUMPTION_MESSAGES = {
            'Not enough full refuelings.': 'Brak wystarczającej liczby tankowań do pełna.',
            'Not enough data to calculate consumption (min. 2 refuelings).': 'Zbyt mało danych do obliczenia spalania (min. 2 tankowania).',
        };
        setConsumptionMsg(CONSUMPTION_MESSAGES[res.data.message] ?? res.data.message);
        }
    } else {
      setConsumptionMsg('Nie udało się pobrać danych o spalaniu.');
    }
    setConsumptionLoading(false);
  }, [vehicle.id, selectedFuelType]);

  useEffect(() => { fetchConsumption(); }, [fetchConsumption]);

  const openAdd = () => {
    setEditingLog(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (log) => {
    setEditingLog(log);
    setForm({
      date:            toDatetimeLocal(log.date),
      mileage:         log.mileage,
      fuel_type:       log.fuel_type,
      liters:          log.liters,
      price_per_liter: log.price_per_liter,
      total_price:     log.total_price,
      is_full:         log.is_full,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLog(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!form.date)            return 'Data tankowania jest wymagana.';
    if (form.mileage === '')   return 'Przebieg jest wymagany.';
    if (form.liters === '')    return 'Ilość paliwa jest wymagana.';
    if (Number(form.liters) <= 0) return 'Ilość paliwa musi być większa od 0.';
    if (form.price_per_liter === '') return 'Cena za litr jest wymagana.';
    if (Number(form.price_per_liter) <= 0) return 'Cena za litr musi być większa od 0.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { showAlert('error', err); return; }

    setSaving(true);

    const payload = {
      date:            new Date(form.date).toISOString(),
      mileage:         Number(form.mileage),
      fuel_type:       form.fuel_type,
      liters:          Number(form.liters),
      price_per_liter: Number(form.price_per_liter),
      total_price:     form.total_price !== '' ? Number(form.total_price) : 0,
      is_full:         form.is_full,
    };

    const res = editingLog
      ? await vehicleApi.updateFuelLog(vehicle.id, editingLog.id, payload)
      : await vehicleApi.addFuelLog(vehicle.id, payload);

    setSaving(false);

    if (res.ok) {
      showAlert('success', editingLog ? 'Tankowanie zaktualizowane.' : 'Tankowanie dodane.');
      closeForm();
      fetchLogs();
      fetchConsumption();
    } else {
      const detail = res.data?.detail ?? res.data?.message;
      showAlert('error', detail || 'Nie udało się zapisać tankowania.');
    }
  };

  const handleDeleteConfirmed = async () => {
    const res = await vehicleApi.deleteFuelLog(vehicle.id, confirmDelete.id);
    setConfirmDelete(null);
    if (res.ok) {
      showAlert('success', 'Tankowanie usunięte.');
      fetchLogs();
      fetchConsumption();
    } else {
      showAlert('error', 'Nie udało się usunąć tankowania.');
    }
  };

  return (
    <div className="service-section">

      <div className="service-section-header">
        <span className="service-section-title">
          ⛽ Tankowania — {vehicle.brand} {vehicle.model}
        </span>
        <button
          className="vehicle-btn-primary"
          onClick={showForm && !editingLog ? closeForm : openAdd}
        >
          {showForm && !editingLog ? 'Anuluj' : '+ Dodaj tankowanie'}
        </button>
      </div>

      {alert && <div className={`vehicle-alert ${alert.type}`}>{alert.msg}</div>}

      <div className="fuel-consumption-box">
        <div className="fuel-consumption-header">
          <span className="service-section-title" style={{ fontSize: '0.75rem' }}>
            📊 Średnie spalanie
          </span>
          <select
            className="vehicle-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
            value={selectedFuelType}
            onChange={(e) => setSelectedFuelType(e.target.value)}
          >
            {FUEL_TYPES.map((ft) => (
              <option key={ft} value={ft}>{FUEL_LABEL[ft]}</option>
            ))}
          </select>
        </div>

        {consumptionLoading ? (
          <div className="vehicle-loading" style={{ padding: '16px' }}>Obliczanie...</div>
        ) : consumptionMsg ? (
          <div className="vehicle-empty" style={{ padding: '14px' }}>{consumptionMsg}</div>
        ) : consumption ? (
          <>
            <div className="fuel-avg-value">
              {consumption.average_consumption > 0
                ? `${Number(consumption.average_consumption).toFixed(2)} l/100km`
                : '— l/100km'}
            </div>
            {consumption.history?.length > 0 && (
              <div className="fuel-consumption-history">
                <div className="service-items-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  <span>Data</span>
                  <span>Dystans</span>
                  <span>Litry</span>
                  <span>Spalanie</span>
                </div>
                {consumption.history.map((row, i) => (
                  <div
                    key={i}
                    className="service-item-row"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}
                  >
                    <span>{formatDate(row.date)}</span>
                    <span>{formatMileage(row.distance)}</span>
                    <span>{Number(row.liters).toFixed(2)} l</span>
                    <span>
                      {row.consumption > 0
                        ? `${Number(row.consumption).toFixed(2)} l/100km`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {showForm && (
        <div className="add-event-form">
          <p className="vehicle-form-title">
            {editingLog ? '✏️ Edycja tankowania' : '⛽ Nowe tankowanie'}
          </p>
          <div className="insurance-form-grid">

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Data i godzina</label>
              <input
                className="vehicle-input"
                type="datetime-local"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Przebieg (km)</label>
              <input
                className="vehicle-input"
                type="number"
                min="0"
                name="mileage"
                value={form.mileage}
                onChange={handleChange}
                placeholder="np. 126000"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Rodzaj paliwa</label>
              <select
                className="vehicle-select"
                name="fuel_type"
                value={form.fuel_type}
                onChange={handleChange}
              >
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>{FUEL_LABEL[ft]}</option>
                ))}
              </select>
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Ilość (litry)</label>
              <input
                className="vehicle-input"
                type="number"
                min="0"
                step="0.01"
                name="liters"
                value={form.liters}
                onChange={handleChange}
                placeholder="np. 45.50"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Cena / litr (PLN)</label>
              <input
                className="vehicle-input"
                type="number"
                min="0"
                step="0.01"
                name="price_per_liter"
                value={form.price_per_liter}
                onChange={handleChange}
                placeholder="np. 6.49"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Łączny koszt (PLN)</label>
              <input
                className="vehicle-input"
                type="number"
                min="0"
                step="0.01"
                name="total_price"
                value={form.total_price}
                onChange={handleChange}
                placeholder="Zostaw puste — wyliczy się automatycznie"
              />
            </div>

            <div className="vehicle-form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="vehicle-form-label">&nbsp;</label>
              <label className="vehicle-checkbox-label" style={{ marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  name="is_full"
                  checked={form.is_full}
                  onChange={handleChange}
                />
                Tankowanie do pełna
              </label>
            </div>

            <div className="vehicle-form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="vehicle-form-label">&nbsp;</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="vehicle-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Zapisywanie...' : editingLog ? 'Zapisz zmiany' : 'Dodaj'}
                </button>
                {editingLog && (
                  <button className="vehicle-btn-secondary" onClick={closeForm}>
                    Anuluj
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {loading ? (
        <div className="vehicle-loading">Ładowanie tankowań...</div>
      ) : logs.length === 0 ? (
        <div className="vehicle-empty">Brak tankowań. Dodaj pierwsze powyżej.</div>
      ) : (
        <div className="vehicle-list">
          {logs.map((log) => (
            <div key={log.id} className="vehicle-card" style={{ cursor: 'default' }}>

              <div className="vehicle-card-icon">⛽</div>

              <div className="vehicle-card-info">
                <div className="vehicle-card-title">
                  {formatDate(log.date)}
                  {' '}
                  <span className="vehicle-badge active" style={{ marginLeft: '8px' }}>
                    {FUEL_LABEL[log.fuel_type] ?? log.fuel_type}
                  </span>
                  {log.is_full && (
                    <span
                      className="vehicle-badge"
                      style={{
                        marginLeft: '6px',
                        background: 'rgba(37,117,252,0.12)',
                        color: '#2575fc',
                        border: '1px solid rgba(37,117,252,0.25)',
                      }}
                    >
                      Do pełna
                    </span>
                  )}
                </div>
                <div className="vehicle-card-meta">
                  <span className="vehicle-meta-item">
                    📍 Przebieg: <strong>{formatMileage(log.mileage)}</strong>
                  </span>
                  <span className="vehicle-meta-item">
                    🪣 Ilość: <strong>{Number(log.liters).toFixed(2)} l</strong>
                  </span>
                  <span className="vehicle-meta-item">
                    💧 Cena/l: <strong>{Number(log.price_per_liter).toFixed(2)} PLN</strong>
                  </span>
                  <span className="vehicle-meta-item">
                    💰 Łącznie: <strong>{formatCost(log.total_price)}</strong>
                  </span>
                </div>
              </div>

              <div className="vehicle-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="vehicle-btn-icon"
                  onClick={() => openEdit(log)}
                  title="Edytuj"
                >
                  ✏️ Edytuj
                </button>
                <button
                  className="vehicle-btn-danger"
                  onClick={() => setConfirmDelete({ id: log.id, label: formatDate(log.date) })}
                  title="Usuń"
                >
                  🗑
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="vehicle-confirm-overlay">
          <div className="vehicle-confirm-box">
            <h3>⚠️ Usunąć tankowanie?</h3>
            <p>
              Usunięcie wpisu z dnia <strong>{confirmDelete.label}</strong> jest nieodwracalne.
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

export default FuelHistory;
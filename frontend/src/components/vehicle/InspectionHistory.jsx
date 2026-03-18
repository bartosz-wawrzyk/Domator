import { useState, useEffect, useCallback } from 'react';
import * as vehicleApi from '../../api/vehicle';

const EMPTY_FORM = {
  inspection_date:  '',
  expiration_date:  '',
  current_mileage:  '',
  cost:             '',
  station_name:     '',
  station_location: '',
  notes:            '',
};

function InspectionHistory({ vehicle }) {
  const [inspections, setInspections]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alert, setAlert]                 = useState(null);

  const [showForm, setShowForm]           = useState(false);
  const [editingInspection, setEditingInspection] = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const formatCost = (val) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val ?? 0);

  const formatMileage = (val) =>
    new Intl.NumberFormat('pl-PL').format(val) + ' km';

  const toDateInput = (iso) => (iso ? iso.split('T')[0] : '');

  const daysToExpiry = (iso) => {
    if (!iso) return null;
    const diff = new Date(iso) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    const res = await vehicleApi.getInspections(vehicle.id);
    if (res.ok) {
      setInspections(Array.isArray(res.data) ? res.data : []);
    } else {
      showAlert('error', 'Nie udało się pobrać badań technicznych.');
    }
    setLoading(false);
  }, [vehicle.id]);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  const openAdd = () => {
    setEditingInspection(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (inspection) => {
    setEditingInspection(inspection);
    setForm({
      inspection_date:  toDateInput(inspection.inspection_date),
      expiration_date:  toDateInput(inspection.expiration_date),
      current_mileage:  inspection.current_mileage,
      cost:             inspection.cost,
      station_name:     inspection.station_name ?? '',
      station_location: inspection.station_location ?? '',
      notes:            inspection.notes ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingInspection(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.inspection_date)        return 'Data badania jest wymagana.';
    if (!form.expiration_date)        return 'Data ważności jest wymagana.';
    if (form.expiration_date < form.inspection_date)
      return 'Data ważności nie może być wcześniejsza niż data badania.';
    if (form.current_mileage === '')  return 'Przebieg jest wymagany.';
    if (form.cost === '')             return 'Koszt jest wymagany.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { showAlert('error', err); return; }

    setSaving(true);

    const payload = {
      inspection_date:  new Date(form.inspection_date).toISOString(),
      expiration_date:  new Date(form.expiration_date).toISOString(),
      current_mileage:  Number(form.current_mileage),
      cost:             Number(form.cost),
      station_name:     form.station_name.trim() || null,
      station_location: form.station_location.trim() || null,
      notes:            form.notes.trim() || null,
    };

    const res = editingInspection
      ? await vehicleApi.updateInspection(vehicle.id, editingInspection.id, payload)
      : await vehicleApi.addInspection(vehicle.id, payload);

    setSaving(false);

    if (res.ok) {
      showAlert('success', editingInspection ? 'Badanie zaktualizowane.' : 'Badanie dodane.');
      closeForm();
      fetchInspections();
    } else {
      showAlert('error', res.data?.detail || 'Nie udało się zapisać badania.');
    }
  };

  const handleDeleteConfirmed = async () => {
    const res = await vehicleApi.deleteInspection(vehicle.id, confirmDelete.id);
    setConfirmDelete(null);
    if (res.ok) {
      showAlert('success', 'Badanie techniczne usunięte.');
      fetchInspections();
    } else {
      showAlert('error', 'Nie udało się usunąć badania.');
    }
  };

  return (
    <div className="service-section">

      <div className="service-section-header">
        <span className="service-section-title">
          🔍 Badania techniczne — {vehicle.brand} {vehicle.model}
        </span>
        <button
          className="vehicle-btn-primary"
          onClick={showForm && !editingInspection ? closeForm : openAdd}
        >
          {showForm && !editingInspection ? 'Anuluj' : '+ Dodaj badanie'}
        </button>
      </div>

      {alert && <div className={`vehicle-alert ${alert.type}`}>{alert.msg}</div>}

      {showForm && (
        <div className="add-event-form">
          <p className="vehicle-form-title">
            {editingInspection ? '✏️ Edycja badania' : '🔍 Nowe badanie techniczne'}
          </p>
          <div className="insurance-form-grid">

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Data badania</label>
              <input
                className="vehicle-input"
                type="date"
                name="inspection_date"
                value={form.inspection_date}
                onChange={handleChange}
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Ważne do</label>
              <input
                className="vehicle-input"
                type="date"
                name="expiration_date"
                value={form.expiration_date}
                onChange={handleChange}
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Przebieg (km)</label>
              <input
                className="vehicle-input"
                type="number"
                min="0"
                name="current_mileage"
                value={form.current_mileage}
                onChange={handleChange}
                placeholder="np. 125000"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Koszt (PLN)</label>
              <input
                className="vehicle-input"
                type="number"
                min="0"
                step="0.01"
                name="cost"
                value={form.cost}
                onChange={handleChange}
                placeholder="np. 150.00"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Stacja kontroli</label>
              <input
                className="vehicle-input"
                name="station_name"
                value={form.station_name}
                onChange={handleChange}
                placeholder="Opcjonalnie"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Lokalizacja stacji</label>
              <input
                className="vehicle-input"
                name="station_location"
                value={form.station_location}
                onChange={handleChange}
                placeholder="Opcjonalnie"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Notatki</label>
              <input
                className="vehicle-input"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Opcjonalnie"
              />
            </div>

            <div className="vehicle-form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="vehicle-form-label">&nbsp;</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="vehicle-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Zapisywanie...' : editingInspection ? 'Zapisz zmiany' : 'Dodaj'}
                </button>
                {editingInspection && (
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
        <div className="vehicle-loading">Ładowanie badań...</div>
      ) : inspections.length === 0 ? (
        <div className="vehicle-empty">Brak badań technicznych. Dodaj pierwsze powyżej.</div>
      ) : (
        <div className="vehicle-list">
          {inspections.map((insp) => {
            const days    = daysToExpiry(insp.expiration_date);
            const expired = days !== null && days < 0;
            const soon    = days !== null && days >= 0 && days <= 30;

            return (
              <div key={insp.id} className="vehicle-card" style={{ cursor: 'default' }}>

                <div className="vehicle-card-icon">🔍</div>

                <div className="vehicle-card-info">
                  <div className="vehicle-card-title">
                    {formatDate(insp.inspection_date)}
                    {' '}
                    {expired && (
                      <span className="vehicle-badge inactive" style={{ marginLeft: '8px' }}>
                        Wygasłe
                      </span>
                    )}
                    {soon && !expired && (
                      <span
                        className="vehicle-badge"
                        style={{
                          marginLeft: '8px',
                          background: 'rgba(255,180,0,0.15)',
                          color: '#ffb400',
                          border: '1px solid rgba(255,180,0,0.3)',
                        }}
                      >
                        ⚠️ Wygasa za {days} dni
                      </span>
                    )}
                    {!expired && !soon && (
                      <span className="vehicle-badge active" style={{ marginLeft: '8px' }}>
                        Ważne
                      </span>
                    )}
                  </div>

                  <div className="vehicle-card-meta">
                    <span className="vehicle-meta-item">
                      📅 Ważne do: <strong>{formatDate(insp.expiration_date)}</strong>
                    </span>
                    <span className="vehicle-meta-item">
                      📍 Przebieg: <strong>{formatMileage(insp.current_mileage)}</strong>
                    </span>
                    <span className="vehicle-meta-item">
                      💰 Koszt: <strong>{formatCost(insp.cost)}</strong>
                    </span>
                    {insp.station_name && (
                      <span className="vehicle-meta-item">
                        🏢 Stacja: <strong>{insp.station_name}</strong>
                      </span>
                    )}
                    {insp.station_location && (
                      <span className="vehicle-meta-item">
                        📌 <strong>{insp.station_location}</strong>
                      </span>
                    )}
                    {insp.notes && (
                      <span className="vehicle-meta-item">
                        📝 <strong>{insp.notes}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="vehicle-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="vehicle-btn-icon"
                    onClick={() => openEdit(insp)}
                    title="Edytuj"
                  >
                    ✏️ Edytuj
                  </button>
                  <button
                    className="vehicle-btn-danger"
                    onClick={() => setConfirmDelete({
                      id:    insp.id,
                      label: formatDate(insp.inspection_date),
                    })}
                    title="Usuń"
                  >
                    🗑
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="vehicle-confirm-overlay">
          <div className="vehicle-confirm-box">
            <h3>⚠️ Usunąć badanie?</h3>
            <p>
              Usunięcie badania z dnia <strong>{confirmDelete.label}</strong> jest nieodwracalne.
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

export default InspectionHistory;
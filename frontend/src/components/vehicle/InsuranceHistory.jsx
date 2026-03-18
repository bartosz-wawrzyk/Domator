import { useState, useEffect, useCallback } from 'react';
import * as vehicleApi from '../../api/vehicle';

const EMPTY_FORM = {
  policy_number:  '',
  insurer_name:   '',
  start_date:     '',
  end_date:       '',
  total_cost:     '',
  policy_type:    'OC',
  agent_contact:  '',
};

const STATUS_META = {
  ACTIVE:  { label: 'Aktywna',   css: 'active'  },
  EXPIRED: { label: 'Wygasła',   css: 'inactive' },
  FUTURE:  { label: 'Przyszła',  css: 'future'  },
};

function InsuranceHistory({ vehicle }) {
  const [policies, setPolicies]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alert, setAlert]                 = useState(null);

  const [showForm, setShowForm]           = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
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

  const toDateInput = (iso) => (iso ? iso.split('T')[0] : '');

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    const res = await vehicleApi.getInsurancePolicies(vehicle.id);
    if (res.ok) {
      setPolicies(Array.isArray(res.data) ? res.data : []);
    } else {
      showAlert('error', 'Nie udało się pobrać polis.');
    }
    setLoading(false);
  }, [vehicle.id]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const openAdd = () => {
    setEditingPolicy(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (policy) => {
    setEditingPolicy(policy);
    setForm({
      policy_number: policy.policy_number,
      insurer_name:  policy.insurer_name,
      start_date:    toDateInput(policy.start_date),
      end_date:      toDateInput(policy.end_date),
      total_cost:    policy.total_cost,
      policy_type:   policy.policy_type,
      agent_contact: policy.agent_contact ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPolicy(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.policy_number.trim()) return 'Numer polisy jest wymagany.';
    if (!form.insurer_name.trim())  return 'Nazwa ubezpieczyciela jest wymagana.';
    if (!form.start_date)           return 'Data początku jest wymagana.';
    if (!form.end_date)             return 'Data końca jest wymagana.';
    if (form.end_date < form.start_date) return 'Data końca nie może być wcześniejsza niż start.';
    if (form.total_cost === '')     return 'Koszt jest wymagany.';
    if (!form.policy_type.trim())   return 'Typ polisy jest wymagany.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { showAlert('error', err); return; }

    setSaving(true);

    const payload = {
      policy_number:  form.policy_number.trim(),
      insurer_name:   form.insurer_name.trim(),
      start_date:     new Date(form.start_date).toISOString(),
      end_date:       new Date(form.end_date).toISOString(),
      total_cost:     Number(form.total_cost),
      policy_type:    form.policy_type.trim().toUpperCase(),
      agent_contact:  form.agent_contact.trim(),
    };

    const res = editingPolicy
      ? await vehicleApi.updateInsurancePolicy(vehicle.id, editingPolicy.id, payload)
      : await vehicleApi.createInsurancePolicy(vehicle.id, payload);

    setSaving(false);

    if (res.ok) {
      showAlert('success', editingPolicy ? 'Polisa zaktualizowana.' : 'Polisa dodana.');
      closeForm();
      fetchPolicies();
    } else {
      showAlert('error', res.data?.detail || 'Nie udało się zapisać polisy.');
    }
  };

  const handleDeleteConfirmed = async () => {
    const res = await vehicleApi.deleteInsurancePolicy(vehicle.id, confirmDelete.id);
    setConfirmDelete(null);
    if (res.ok) {
      showAlert('success', 'Polisa usunięta.');
      fetchPolicies();
    } else {
      showAlert('error', 'Nie udało się usunąć polisy.');
    }
  };

  return (
    <div className="service-section">

      <div className="service-section-header">
        <span className="service-section-title">
          🛡️ Polisy ubezpieczeniowe — {vehicle.brand} {vehicle.model}
        </span>
        <button
          className="vehicle-btn-primary"
          onClick={showForm && !editingPolicy ? closeForm : openAdd}
        >
          {showForm && !editingPolicy ? 'Anuluj' : '+ Dodaj polisę'}
        </button>
      </div>

      {alert && <div className={`vehicle-alert ${alert.type}`}>{alert.msg}</div>}

      {showForm && (
        <div className="add-event-form">
          <p className="vehicle-form-title">
            {editingPolicy ? '✏️ Edycja polisy' : '🛡️ Nowa polisa'}
          </p>

          <div className="insurance-form-grid">

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Numer polisy</label>
              <input
                className="vehicle-input"
                name="policy_number"
                value={form.policy_number}
                onChange={handleChange}
                placeholder="np. 147852369"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Ubezpieczyciel</label>
              <input
                className="vehicle-input"
                name="insurer_name"
                value={form.insurer_name}
                onChange={handleChange}
                placeholder="np. PZU, Warta"
              />
            </div>

            <div className="vehicle-form-group">
                <label className="vehicle-form-label">Typ polisy</label>
                <select
                    className="vehicle-select"
                    name="policy_type"
                    value={form.policy_type}
                    onChange={handleChange}
                >
                    <option value="OC">OC</option>
                    <option value="AC">AC</option>
                    <option value="OC+AC">OC+AC</option>
                </select>
            </div>
            
            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Kontakt do agenta</label>
              <input
                className="vehicle-input"
                name="agent_contact"
                value={form.agent_contact}
                onChange={handleChange}
                placeholder="Opcjonalnie"
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Data początku</label>
              <input
                className="vehicle-input"
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Data końca</label>
              <input
                className="vehicle-input"
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>

            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Koszt całkowity (PLN)</label>
              <input
                className="vehicle-input"
                type="number"
                min="0"
                step="0.01"
                name="total_cost"
                value={form.total_cost}
                onChange={handleChange}
                placeholder="0.00"
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
                  {saving ? 'Zapisywanie...' : editingPolicy ? 'Zapisz zmiany' : 'Dodaj'}
                </button>
                {editingPolicy && (
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
        <div className="vehicle-loading">Ładowanie polis...</div>
      ) : policies.length === 0 ? (
        <div className="vehicle-empty">Brak polis. Dodaj pierwszą powyżej.</div>
      ) : (
        <div className="vehicle-list">
          {policies.map((policy) => {
            const statusMeta = STATUS_META[policy.status] ?? { label: policy.status, css: 'inactive' };
            const isExpiring = policy.status === 'ACTIVE' && policy.days_to_expiry <= 30;

            return (
              <div key={policy.id} className="vehicle-card" style={{ cursor: 'default' }}>

                <div className="vehicle-card-icon">🛡️</div>

                <div className="vehicle-card-info">
                  <div className="vehicle-card-title">
                    {policy.insurer_name}
                    {' '}
                    <span
                      className={`vehicle-badge ${statusMeta.css}`}
                      style={{ marginLeft: '8px' }}
                    >
                      {statusMeta.label}
                    </span>
                    {isExpiring && (
                      <span
                        className="vehicle-badge"
                        style={{
                          marginLeft: '6px',
                          background: 'rgba(255,180,0,0.15)',
                          color: '#ffb400',
                          border: '1px solid rgba(255,180,0,0.3)',
                        }}
                      >
                        ⚠️ Wygasa za {policy.days_to_expiry} dni
                      </span>
                    )}
                  </div>

                  <div className="vehicle-card-meta">
                    <span className="vehicle-meta-item">
                      📋 Nr: <strong>{policy.policy_number}</strong>
                    </span>
                    <span className="vehicle-meta-item">
                      🏷️ Typ: <strong>{policy.policy_type}</strong>
                    </span>
                    <span className="vehicle-meta-item">
                      📅 <strong>{formatDate(policy.start_date)}</strong>
                      {' → '}
                      <strong>{formatDate(policy.end_date)}</strong>
                    </span>
                    <span className="vehicle-meta-item">
                      💰 Koszt: <strong>{formatCost(policy.total_cost)}</strong>
                    </span>
                    {policy.agent_contact && (
                      <span className="vehicle-meta-item">
                        📞 Agent: <strong>{policy.agent_contact}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="vehicle-card-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="vehicle-btn-icon"
                    onClick={() => openEdit(policy)}
                    title="Edytuj polisę"
                  >
                    ✏️ Edytuj
                  </button>
                  <button
                    className="vehicle-btn-danger"
                    onClick={() =>
                      setConfirmDelete({
                        id:    policy.id,
                        label: `${policy.insurer_name} (${policy.policy_number})`,
                      })
                    }
                    title="Usuń polisę"
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
            <h3>⚠️ Usunąć polisę?</h3>
            <p>
              Usunięcie polisy <strong>{confirmDelete.label}</strong> jest nieodwracalne.
            </p>
            <div className="vehicle-confirm-actions">
              <button
                className="vehicle-confirm-cancel"
                onClick={() => setConfirmDelete(null)}
              >
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

export default InsuranceHistory;
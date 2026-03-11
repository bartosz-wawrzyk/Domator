import { useState, useEffect, useCallback } from 'react';
import * as serviceApi from '../../api/services';

const EMPTY_EVENT_FORM = {
  service_date: '',
  mileage_at_service: '',
  notes: '',
};

const EMPTY_ITEM_FORM = {
  type: '',
  description: '',
  cost: '',
  is_recurring: false,
  interval_km: '',
  interval_months: '',
};

function ServiceHistory({ vehicle }) {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [showEventForm, setShowEventForm]   = useState(false);
  const [editingEvent, setEditingEvent]     = useState(null);
  const [eventForm, setEventForm]           = useState(EMPTY_EVENT_FORM);
  const [eventLoading, setEventLoading]     = useState(false);
  const [activeItemForm, setActiveItemForm] = useState(null);
  const [itemForm, setItemForm]             = useState(EMPTY_ITEM_FORM);
  const [itemLoading, setItemLoading]       = useState(false);
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


  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const res = await serviceApi.getVehicleServiceHistory(vehicle.id);
    if (res.ok) {
      setEvents(res.data);
    } else {
      showAlert('error', 'Nie udało się pobrać historii serwisowej.');
    }
    setLoading(false);
  }, [vehicle.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const openAddEvent = () => {
    setEditingEvent(null);
    setEventForm(EMPTY_EVENT_FORM);
    setShowEventForm(true);
  };

  const openEditEvent = (event, e) => {
    e.stopPropagation();
    setEditingEvent(event);
    setEventForm({
      service_date:       event.service_date.split('T')[0],
      mileage_at_service: event.mileage_at_service,
      notes:              event.notes ?? '',
    });
    setShowEventForm(true);
    setExpandedEventId(event.id);
  };

  const closeEventForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    setEventForm(EMPTY_EVENT_FORM);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.service_date) { showAlert('error', 'Data serwisu jest wymagana.'); return; }
    if (!eventForm.mileage_at_service && eventForm.mileage_at_service !== 0) {
      showAlert('error', 'Przebieg jest wymagany.'); return;
    }

    setEventLoading(true);

    let res;
    if (editingEvent) {
      res = await serviceApi.updateServiceEvent(editingEvent.id, {
        service_date:       new Date(eventForm.service_date).toISOString(),
        mileage_at_service: Number(eventForm.mileage_at_service),
        notes:              eventForm.notes || null,
      });
    } else {
      res = await serviceApi.createServiceEvent({
        vehicle_id:         vehicle.id,
        service_date:       new Date(eventForm.service_date).toISOString(),
        mileage_at_service: Number(eventForm.mileage_at_service),
        notes:              eventForm.notes || null,
      });
    }

    setEventLoading(false);

    if (res.ok) {
      showAlert('success', editingEvent ? 'Wpis zaktualizowany.' : 'Wpis serwisowy dodany.');
      closeEventForm();
      fetchHistory();
    } else {
      let errorMsg = res.data?.detail;

      if (typeof errorMsg === 'string' && errorMsg.includes('Mileage at service cannot be lower')) {
        const match = errorMsg.match(/\d+/);
        const currentKm = match ? match[0] : "";
        errorMsg = `Przebieg serwisu nie może być niższy niż obecny stan licznika (${currentKm} km).`;
      } else if (Array.isArray(errorMsg)) {
        errorMsg = "Błąd walidacji danych.";
      } else {
        errorMsg = errorMsg || 'Nie udało się zapisać wpisu.';
      }

      showAlert('error', errorMsg);
    }
  };

  const handleDeleteEvent = async () => {
    const res = await serviceApi.deleteServiceEvent(confirmDelete.id);
    setConfirmDelete(null);
    if (res.ok) {
      showAlert('success', 'Wpis serwisowy usunięty.');
      fetchHistory();
    } else {
      showAlert('error', 'Nie udało się usunąć wpisu.');
    }
  };

  const openAddItem = (eventId) => {
    setActiveItemForm({ eventId, item: null });
    setItemForm(EMPTY_ITEM_FORM);
  };

  const openEditItem = (eventId, item) => {
    setActiveItemForm({ eventId, item });
    setItemForm({
      type:            item.type,
      description:     item.description ?? '',
      cost:            item.cost,
      is_recurring:    item.is_recurring,
      interval_km:     item.interval_km ?? '',
      interval_months: item.interval_months ?? '',
    });
  };

  const closeItemForm = () => {
    setActiveItemForm(null);
    setItemForm(EMPTY_ITEM_FORM);
  };

  const handleSaveItem = async () => {
    if (!itemForm.type.trim()) { showAlert('error', 'Typ jest wymagany.'); return; }
    if (itemForm.cost === '')  { showAlert('error', 'Koszt jest wymagany.'); return; }

    setItemLoading(true);

    const isEdit = Boolean(activeItemForm?.item);
    let res;

    if (isEdit) {
      res = await serviceApi.updateServiceItem(activeItemForm.item.id, {
        type:            itemForm.type.trim(),
        description:     itemForm.description.trim(),
        cost:            Number(itemForm.cost),
        is_recurring:    itemForm.is_recurring,
        interval_km:     itemForm.is_recurring && itemForm.interval_km !== ''
                           ? Number(itemForm.interval_km) : null,
        interval_months: itemForm.is_recurring && itemForm.interval_months !== ''
                           ? Number(itemForm.interval_months) : null,
      });
    } else {
      res = await serviceApi.addServiceItem({
        service_event_id: activeItemForm.eventId,
        type:             itemForm.type.trim(),
        description:      itemForm.description.trim(),
        cost:             Number(itemForm.cost),
        is_recurring:     itemForm.is_recurring,
        interval_km:      itemForm.is_recurring && itemForm.interval_km !== ''
                            ? Number(itemForm.interval_km) : null,
        interval_months:  itemForm.is_recurring && itemForm.interval_months !== ''
                            ? Number(itemForm.interval_months) : null,
      });
    }

    setItemLoading(false);

    if (res.ok) {
      showAlert('success', isEdit ? 'Pozycja zaktualizowana.' : 'Pozycja dodana.');
      closeItemForm();
      fetchHistory();
    } else {
      showAlert('error', res.data?.detail || 'Nie udało się zapisać pozycji.');
    }
  };

  const handleDeleteItem = async () => {
    const res = await serviceApi.deleteServiceItem(confirmDelete.id);
    setConfirmDelete(null);
    if (res.ok) {
      showAlert('success', 'Pozycja usunięta.');
      fetchHistory();
    } else {
      showAlert('error', 'Nie udało się usunąć pozycji.');
    }
  };

  const renderItemForm = (eventId) => (
    <div className="add-item-form">
      <p className="vehicle-form-title">
        {activeItemForm?.item ? '✏️ Edycja pozycji' : '+ Nowa pozycja'}
      </p>
      <div className="add-item-grid">
        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Typ</label>
          <input
            className="vehicle-input"
            placeholder="np. Olej silnikowy"
            value={itemForm.type}
            onChange={(e) => setItemForm((p) => ({ ...p, type: e.target.value }))}
          />
        </div>
        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Opis</label>
          <input
            className="vehicle-input"
            placeholder="Opcjonalnie"
            value={itemForm.description}
            onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
        <div className="vehicle-form-group">
          <label className="vehicle-form-label">Koszt (PLN)</label>
          <input
            className="vehicle-input" type="number" min="0" step="0.01"
            placeholder="0.00"
            value={itemForm.cost}
            onChange={(e) => setItemForm((p) => ({ ...p, cost: e.target.value }))}
          />
        </div>
        <div className="vehicle-form-group" style={{ justifyContent: 'flex-end' }}>
          <label className="vehicle-form-label">&nbsp;</label>
          <button
            className="vehicle-btn-primary"
            onClick={handleSaveItem}
            disabled={itemLoading}
          >
            {itemLoading ? '...' : activeItemForm?.item ? 'Zapisz' : 'Dodaj'}
          </button>
        </div>
      </div>

      <div className="add-item-recurring-row">
        <label className="vehicle-checkbox-label">
          <input
            type="checkbox"
            checked={itemForm.is_recurring}
            onChange={(e) => setItemForm((p) => ({ ...p, is_recurring: e.target.checked }))}
          />
          Cykliczne
        </label>

        {itemForm.is_recurring && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label className="vehicle-form-label" style={{ marginBottom: 0 }}>Co</label>
              <input
                className="vehicle-input" type="number" min="0"
                style={{ width: '110px' }} placeholder="km"
                value={itemForm.interval_km}
                onChange={(e) => setItemForm((p) => ({ ...p, interval_km: e.target.value }))}
              />
              <label className="vehicle-form-label" style={{ marginBottom: 0 }}>km</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label className="vehicle-form-label" style={{ marginBottom: 0 }}>lub co</label>
              <input
                className="vehicle-input" type="number" min="0"
                style={{ width: '80px' }} placeholder="mies."
                value={itemForm.interval_months}
                onChange={(e) => setItemForm((p) => ({ ...p, interval_months: e.target.value }))}
              />
              <label className="vehicle-form-label" style={{ marginBottom: 0 }}>miesięcy</label>
            </div>
          </>
        )}

        <button
          className="vehicle-btn-secondary"
          style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}
          onClick={closeItemForm}
        >
          Anuluj
        </button>
      </div>
    </div>
  );

  return (
    <div className="service-section">

      <div className="service-section-header">
        <span className="service-section-title">
          🔧 Historia serwisowa — {vehicle.brand} {vehicle.model}
        </span>
        <button
          className="vehicle-btn-primary"
          onClick={showEventForm ? closeEventForm : openAddEvent}
        >
          {showEventForm && !editingEvent ? 'Anuluj' : '+ Nowy wpis'}
        </button>
      </div>

      {alert && <div className={`vehicle-alert ${alert.type}`}>{alert.msg}</div>}

      {showEventForm && !editingEvent && (
        <div className="add-event-form">
          <p className="vehicle-form-title">Nowy wpis serwisowy</p>
          <div className="add-event-grid">
            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Data serwisu</label>
              <input
                className="vehicle-input" type="date"
                value={eventForm.service_date}
                onChange={(e) => setEventForm((p) => ({ ...p, service_date: e.target.value }))}
              />
            </div>
            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Przebieg (km)</label>
              <input
                className="vehicle-input" type="number" min="0"
                placeholder="np. 125000"
                value={eventForm.mileage_at_service}
                onChange={(e) => setEventForm((p) => ({ ...p, mileage_at_service: e.target.value }))}
              />
            </div>
            <div className="vehicle-form-group">
              <label className="vehicle-form-label">Notatki</label>
              <input
                className="vehicle-input"
                placeholder="Opcjonalnie..."
                value={eventForm.notes}
                onChange={(e) => setEventForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="vehicle-form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="vehicle-form-label">&nbsp;</label>
              <button
                className="vehicle-btn-primary"
                onClick={handleSaveEvent}
                disabled={eventLoading}
              >
                {eventLoading ? 'Dodawanie...' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="vehicle-loading">Ładowanie historii...</div>
      ) : events.length === 0 ? (
        <div className="vehicle-empty">Brak wpisów serwisowych. Dodaj pierwszy powyżej.</div>
      ) : (
        events.map((event) => {
          const isExpanded  = expandedEventId === event.id;
          const isEditing   = editingEvent?.id === event.id;

          return (
            <div key={event.id} className="service-event-card">

              {isEditing ? (
                <div style={{ padding: '16px 18px' }}>
                  <p className="vehicle-form-title">✏️ Edycja wpisu serwisowego</p>
                  <div className="add-event-grid">
                    <div className="vehicle-form-group">
                      <label className="vehicle-form-label">Data serwisu</label>
                      <input
                        className="vehicle-input" type="date"
                        value={eventForm.service_date}
                        onChange={(e) => setEventForm((p) => ({ ...p, service_date: e.target.value }))}
                      />
                    </div>
                    <div className="vehicle-form-group">
                      <label className="vehicle-form-label">Przebieg (km)</label>
                      <input
                        className="vehicle-input" type="number" min="0"
                        value={eventForm.mileage_at_service}
                        onChange={(e) => setEventForm((p) => ({ ...p, mileage_at_service: e.target.value }))}
                      />
                    </div>
                    <div className="vehicle-form-group">
                      <label className="vehicle-form-label">Notatki</label>
                      <input
                        className="vehicle-input"
                        value={eventForm.notes}
                        onChange={(e) => setEventForm((p) => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                    <div className="vehicle-form-group" style={{ justifyContent: 'flex-end' }}>
                      <label className="vehicle-form-label">&nbsp;</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="vehicle-btn-primary"
                          onClick={handleSaveEvent}
                          disabled={eventLoading}
                        >
                          {eventLoading ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                        <button className="vehicle-btn-secondary" onClick={closeEventForm}>
                          Anuluj
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="service-event-header"
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                >
                  <div>
                    <div className="service-event-date">{formatDate(event.service_date)}</div>
                    <div className="service-event-mileage">
                      {formatMileage(event.mileage_at_service)}
                      {event.notes && ` · ${event.notes}`}
                    </div>
                  </div>
                  <div className="service-event-cost">{formatCost(event.total_cost)}</div>
                  <div className="service-event-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="vehicle-btn-icon"
                      onClick={(e) => openEditEvent(event, e)}
                    >
                      ✏️
                    </button>
                    <button
                      className="vehicle-btn-danger"
                      onClick={() => setConfirmDelete({
                        type: 'event',
                        id: event.id,
                        label: `wpis z dnia ${formatDate(event.service_date)}`,
                      })}
                    >
                      🗑
                    </button>
                    <button className="vehicle-btn-icon">
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
              )}

              {(isExpanded || isEditing) && (
                <div className="service-event-body">

                  {event.items && event.items.length > 0 ? (
                    <>
                      <div className="service-items-header">
                        <span>Typ</span>
                        <span>Opis</span>
                        <span>Koszt</span>
                        <span>Cykliczne</span>
                        <span></span>
                      </div>
                      {event.items.map((item) => {
                        const isEditingItem =
                          activeItemForm?.eventId === event.id &&
                          activeItemForm?.item?.id === item.id;

                        if (isEditingItem) {
                          return (
                            <div key={item.id}>
                              {renderItemForm(event.id)}
                            </div>
                          );
                        }

                        return (
                          <div key={item.id} className="service-item-row">
                            <span className="service-item-type">{item.type}</span>
                            <span className="service-item-desc">{item.description || '—'}</span>
                            <span className="service-item-cost">{formatCost(item.cost)}</span>
                            <span className="service-item-recurring">
                              {item.is_recurring ? (
                                <span className="recurring-badge">
                                  {item.interval_km ? `co ${item.interval_km} km` : ''}
                                  {item.interval_km && item.interval_months ? ' / ' : ''}
                                  {item.interval_months ? `co ${item.interval_months} mies.` : ''}
                                </span>
                              ) : '—'}
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="vehicle-btn-icon"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => openEditItem(event.id, item)}
                              >
                                ✏️
                              </button>
                              <button
                                className="vehicle-btn-danger"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => setConfirmDelete({
                                  type: 'item',
                                  id: item.id,
                                  label: item.type,
                                })}
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="vehicle-empty" style={{ padding: '14px', marginBottom: '12px' }}>
                      Brak pozycji — dodaj pierwszą poniżej.
                    </div>
                  )}

                  {activeItemForm?.eventId === event.id && !activeItemForm?.item
                    ? renderItemForm(event.id)
                    : !activeItemForm && (
                      <button
                        className="vehicle-btn-icon"
                        style={{ marginTop: '10px', fontSize: '0.8rem' }}
                        onClick={() => openAddItem(event.id)}
                      >
                        + Dodaj pozycję
                      </button>
                    )
                  }

                </div>
              )}

            </div>
          );
        })
      )}

      {confirmDelete && (
        <div className="vehicle-confirm-overlay">
          <div className="vehicle-confirm-box">
            <h3>⚠️ Usunąć?</h3>
            <p>
              {confirmDelete.type === 'event'
                ? `Usunięcie wpisu serwisowego usunie też wszystkie jego pozycje.`
                : `Usunięcie pozycji "${confirmDelete.label}" zaktualizuje łączny koszt serwisu.`}
            </p>
            <div className="vehicle-confirm-actions">
              <button className="vehicle-confirm-cancel" onClick={() => setConfirmDelete(null)}>
                Anuluj
              </button>
              <button
                className="vehicle-btn-danger"
                onClick={confirmDelete.type === 'event' ? handleDeleteEvent : handleDeleteItem}
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ServiceHistory;
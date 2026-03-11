import { request } from './http';

export function createServiceEvent({ vehicle_id, service_date, mileage_at_service, notes }) {
  return request('/services/events', {
    method: 'POST',
    body: JSON.stringify({ vehicle_id, service_date, mileage_at_service, notes }),
  });
}

export function getVehicleServiceHistory(vehicleId) {
  return request(`/services/vehicle/${vehicleId}`);
}

export function updateServiceEvent(eventId, data) {
  return request(`/services/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteServiceEvent(eventId) {
  return request(`/services/events/${eventId}`, {
    method: 'DELETE',
  });
}

export function addServiceItem({ service_event_id, type, description, cost, is_recurring, interval_km, interval_months }) {
  return request('/services/items', {
    method: 'POST',
    body: JSON.stringify({ service_event_id, type, description, cost, is_recurring, interval_km, interval_months }),
  });
}

export function updateServiceItem(itemId, data) {
  return request(`/services/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteServiceItem(itemId) {
  return request(`/services/items/${itemId}`, {
    method: 'DELETE',
  });
}
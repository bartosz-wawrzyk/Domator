import { request } from './http';

export function createServiceEvent(data) {
  return request('/services/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createServiceItem(data) {
  return request('/services/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getVehicleServices(vehicleId) {
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

export function deleteServiceItem(itemId) {
  return request(`/services/items/${itemId}`, {
    method: 'DELETE',
  });
}
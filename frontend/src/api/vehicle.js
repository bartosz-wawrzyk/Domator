import { request } from './http';

export function getVehicles() {
  return request('/vehicles/');
}

export function createVehicle({
  brand,
  model,
  production_year,
  vin,
  registration_number,
  fuel_type,
  current_mileage,
  last_service_date,
  last_service_mileage,
}) {
  return request('/vehicles/', {
    method: 'POST',
    body: JSON.stringify({
      brand,
      model,
      production_year,
      vin,
      registration_number,
      fuel_type,
      current_mileage,
      last_service_date,
      last_service_mileage,
    }),
  });
}

export function getVehicle(vehicleId) {
  return request(`/vehicles/${vehicleId}`);
}

export function updateVehicle(vehicleId, data) {
  return request(`/vehicles/${vehicleId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteVehicle(vehicleId) {
  return request(`/vehicles/${vehicleId}`, {
    method: 'DELETE',
  });
}
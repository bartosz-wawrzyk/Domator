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

// ─── Insurance ────────────────────────────────────────────────────

export function getInsurancePolicies(vehicleId) {
  return request(`/vehicles/${vehicleId}/insurance/`);
}

export function createInsurancePolicy(vehicleId, data) {
  return request(`/vehicles/${vehicleId}/insurance/`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_id: vehicleId, ...data }),
  });
}

export function updateInsurancePolicy(vehicleId, policyId, data) {
  return request(`/vehicles/${vehicleId}/insurance/${policyId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteInsurancePolicy(vehicleId, policyId) {
  return request(`/vehicles/${vehicleId}/insurance/${policyId}`, {
    method: 'DELETE',
  });
}

// ─── Fuel logs ────────────────────────────────────────────────────────────────

export function getFuelLogs(vehicleId, limit = 20, offset = 0) {
  return request(`/vehicles/${vehicleId}/fuel/?limit=${limit}&offset=${offset}`);
}

export function addFuelLog(vehicleId, data) {
  return request(`/vehicles/${vehicleId}/fuel`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_id: vehicleId, ...data }),
  });
}

export function getFuelConsumption(vehicleId, fuelType) {
  return request(`/vehicles/${vehicleId}/fuel/consumption?fuel_type=${fuelType}`);
}

export function updateFuelLog(vehicleId, logId, data) {
  return request(`/vehicles/${vehicleId}/fuel/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteFuelLog(vehicleId, logId) {
  return request(`/vehicles/${vehicleId}/fuel/${logId}`, {
    method: 'DELETE',
  });
}

// ─── Inspections ──────────────────────────────────────────────────────────────

export function getInspections(vehicleId) {
  return request(`/vehicles/${vehicleId}/inspections/`);
}

export function addInspection(vehicleId, data) {
  return request(`/vehicles/${vehicleId}/inspections/`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_id: vehicleId, ...data }),
  });
}

export function updateInspection(vehicleId, inspectionId, data) {
  return request(`/vehicles/${vehicleId}/inspections/${inspectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteInspection(vehicleId, inspectionId) {
  return request(`/vehicles/${vehicleId}/inspections/${inspectionId}`, {
    method: 'DELETE',
  });
}
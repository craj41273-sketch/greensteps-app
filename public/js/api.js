// public/js/api.js
// Base URL for our secure backend API
const API_BASE = window.location.origin + '/api';

export async function syncToCloudAPI(recordId, stateData) {
  const response = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, data: stateData })
  });
  return response.json();
}

export async function fetchFromCloudAPI(recordId) {
  const response = await fetch(`${API_BASE}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId })
  });
  return response.json();
}

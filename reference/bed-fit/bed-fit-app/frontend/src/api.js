const BASE = import.meta.env.VITE_API_BASE ?? "";

async function unwrap(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    throw new Error(body?.detail || `Request failed (${res.status}).`);
  }
  return body;
}

export function getHealth() {
  return fetch(`${BASE}/api/health`).then(unwrap);
}

export function getSample() {
  return fetch(`${BASE}/api/sample`).then(unwrap);
}

export function getCatalog() {
  return fetch(`${BASE}/api/catalog`).then(unwrap);
}

export function analyzePlan(file) {
  const fd = new FormData();
  fd.append("file", file);
  return fetch(`${BASE}/api/analyze`, { method: "POST", body: fd }).then(unwrap);
}

export function readPlan(file, planWidthFt) {
  const fd = new FormData();
  fd.append("file", file);
  if (planWidthFt) fd.append("plan_width_ft", String(planWidthFt));
  return fetch(`${BASE}/api/read`, { method: "POST", body: fd }).then(unwrap);
}

export function detectWalls(file, planWidthFt) {
  const fd = new FormData();
  fd.append("file", file);
  if (planWidthFt) fd.append("plan_width_ft", String(planWidthFt));
  return fetch(`${BASE}/api/walls`, { method: "POST", body: fd }).then(unwrap);
}

export function placeRooms(rooms) {
  return fetch(`${BASE}/api/place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rooms }),
  }).then(unwrap);
}

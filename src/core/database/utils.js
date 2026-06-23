export function nowIso() {
  return new Date().toISOString();
}

export function parseJson(value, fallback = {}) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function toJson(value) {
  return JSON.stringify(value ?? {});
}

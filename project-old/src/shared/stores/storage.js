export function readPreference(key, fallbackValue = null) {
  try {
    const value = localStorage.getItem(key);

    return value ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function writePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Local preferences can fail in restricted browser contexts.
  }
}

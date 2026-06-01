const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

/**
 * Returns a stable per-browser user ID stored in localStorage.
 * Created once on first visit, never changes.
 */
function getUserId() {
  let uid = localStorage.getItem("mindbridgeUserId");
  if (!uid) {
    uid = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("mindbridgeUserId", uid);
  }
  return uid;
}

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": getUserId(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
}

export { API_BASE };

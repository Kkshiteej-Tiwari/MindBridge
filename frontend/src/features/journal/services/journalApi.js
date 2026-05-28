const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
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

export async function fetchEntries() {
  const payload = await request("/journal");
  return payload.data;
}

export async function createEntry(content = "Write about your day!") {
  const payload = await request("/journal", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return payload.data;
}

export async function updateEntry(entryId, content) {
  const payload = await request(`/journal/${entryId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
  return payload.data;
}

export async function fetchHistory() {
  return request("/journal/history");
}

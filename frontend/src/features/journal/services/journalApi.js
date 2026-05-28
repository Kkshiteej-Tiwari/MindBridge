import { request } from "../../../services/apiClient";

export async function fetchEntries() {
  const payload = await request("/journal");
  return payload.data;
}

export async function createEntry(content = "") {
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

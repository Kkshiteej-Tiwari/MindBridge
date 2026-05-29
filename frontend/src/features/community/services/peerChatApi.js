import { request } from "../../../services/apiClient";

export async function fetchPeerThreads() {
  const response = await request("/community/peer/threads");
  return response.data || [];
}

export async function fetchPeerThread(threadId) {
  const response = await request(`/community/peer/${threadId}`);
  return response.data;
}

export async function sendPeerMessage(payload) {
  const response = await request("/community/peer/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

import { request } from "../../../services/apiClient";

export async function sendCoachMessage({ message, sessionId, history }) {
  const payload = { message, sessionId, history };
  const response = await request("/chat/respond", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

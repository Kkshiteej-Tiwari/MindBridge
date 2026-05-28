import { request } from "../../../services/apiClient";
import { API_BASE } from "../../../services/apiClient";

export async function sendCoachMessage({ message, sessionId, history }) {
  const payload = { message, sessionId, history };
  const response = await request("/chat/respond", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function sendCoachMessageStream({ message, sessionId, history, onDelta }) {
  const payload = { message, sessionId, history };
  const response = await fetch(`${API_BASE}/chat/respond/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to stream response");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundaryIndex = buffer.indexOf("\n\n");
    while (boundaryIndex !== -1) {
      const frame = buffer.slice(0, boundaryIndex).trim();
      buffer = buffer.slice(boundaryIndex + 2);

      const dataLine = frame
        .split("\n")
        .find((line) => line.startsWith("data: "));

      if (dataLine) {
        const event = JSON.parse(dataLine.slice(6));
        if (event.type === "delta" && typeof onDelta === "function") {
          onDelta(event.text || "");
        }
        if (event.type === "done") {
          finalPayload = event.data;
        }
      }

      boundaryIndex = buffer.indexOf("\n\n");
    }
  }

  if (!finalPayload) {
    throw new Error("Streaming response ended without final payload");
  }

  return finalPayload;
}

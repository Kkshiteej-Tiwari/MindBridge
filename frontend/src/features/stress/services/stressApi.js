import { request } from "../../../services/apiClient";

export async function forecastStress(payload) {
  const response = await request("/stress/forecast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response;
}

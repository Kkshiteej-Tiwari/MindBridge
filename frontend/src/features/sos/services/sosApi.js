import { request } from "../../../services/apiClient";

export async function routeSOS(payload) {
  return request("/sos/route", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

import { request } from "../../../services/apiClient";

export async function forecastStress(payload) {
  const response = await request("/stress/forecast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response;
}

export async function importCalendarFeed(calendarUrl) {
  const response = await request("/stress/import-calendar", {
    method: "POST",
    body: JSON.stringify({ calendar_url: calendarUrl }),
  });

  return response;
}

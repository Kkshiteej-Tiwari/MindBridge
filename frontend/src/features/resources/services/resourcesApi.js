import { request } from "../../../services/apiClient";

export async function fetchResources(topic) {
  const query = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  const response = await request(`/resources${query}`);
  return response.data;
}

export async function fetchCrisisResources(country = "India") {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  const response = await request(`/resources/crisis${query}`);
  return response.data;
}

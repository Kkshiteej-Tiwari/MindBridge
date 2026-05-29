import { request } from "../../../services/apiClient";

export async function fetchDashboardSnapshot() {
  const [history, challenges] = await Promise.all([
    request("/journal/history"),
    request("/challenges/daily"),
  ]);

  return {
    history,
    progress: challenges.progress || null,
  };
}

import { request } from "../../../services/apiClient";

export async function fetchDailyChallenges() {
  const response = await request("/challenges/daily");
  return response;
}

export async function completeChallenge(challengeId) {
  const response = await request("/challenges/complete", {
    method: "POST",
    body: JSON.stringify({ challengeId }),
  });
  return response;
}

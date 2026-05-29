import { request } from "../../../services/apiClient";

export async function fetchDailyChallenges() {
  return await request("/challenges/daily");
}

export async function completeChallenge(challengeId) {
  return await request("/challenges/complete", {
    method: "POST",
    body: JSON.stringify({ challengeId }),
  });
}

export default { fetchDailyChallenges, completeChallenge };

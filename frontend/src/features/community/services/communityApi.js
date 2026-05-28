import { request } from "../../../services/apiClient";

export async function fetchCommunityFeed(topic) {
  const query = topic && topic !== "All" ? `?topic=${encodeURIComponent(topic)}` : "";
  const response = await request(`/community/feed${query}`);
  return response.data;
}

export async function createCommunityPost(payload) {
  const response = await request("/community/post", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function reactToPost(postId, reaction) {
  const response = await request("/community/react", {
    method: "POST",
    body: JSON.stringify({ postId, reaction }),
  });
  return response.data;
}

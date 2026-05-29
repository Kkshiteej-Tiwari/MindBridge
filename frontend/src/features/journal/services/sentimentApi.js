import { API_BASE } from "../../../services/apiClient";

const CACHE = new Map(); // simple in-memory cache
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function cacheKey(text) {
  return text.trim();
}

export async function analyzeSentiment(text, { signal } = {}) {
  const key = cacheKey(text);
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && now - cached.t < CACHE_TTL) {
    return cached.v;
  }

  // Prefer explicit port if API_BASE is default; this ensures local dev works when backend runs on 8001
  const base = API_BASE.endsWith(":8000") ? API_BASE : API_BASE;
  const url = `${base}/api/v1/sentiment/analyze`;

  const controller = new AbortController();
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: controller.signal,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(txt || "Sentiment request failed");
  }

  const json = await resp.json();
  CACHE.set(key, { v: json, t: now });
  return json;
}

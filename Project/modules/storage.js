// storage.js - Handle data persistence and retrieval

const STORAGE_KEY = "wayback-posts";
const LEGACY_STORAGE_KEY = "findit-posts";

export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to fallback
    }
  }
  return "post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

export function loadPosts() {
  try {
    // Pick up posts saved under the old app name once, then keep using the new key.
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY, raw);
    }
    if (!raw) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item === "object").map((item) => ({
      id: item.id || generateId(),
      type: item.type === "Found" ? "Found" : "Lost",
      status: item.status === "Resolved" ? "Resolved" : "Open",
      item: item.item || "",
      description: item.description || "",
      location: item.location || "",
      date: item.date || "",
      contact: item.contact || "",
      image: item.image || ""
    }));
  } catch (error) {
    return [];
  }
}

export function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return true;
  } catch (error) {
    return false;
  }
}

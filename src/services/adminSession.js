// src/services/adminSession.js
// Central helpers for managing the admin session + calling Worker APIs.

const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN || "http://localhost:8787";

const STORAGE_KEY = "adminSession";
const DEV_DEFAULT_TOKEN =
  process.env.NODE_ENV !== "production"
    ? process.env.REACT_APP_ADMIN_BEARER || "mock-jwt-token-123"
    : undefined;

const hasWindow = typeof window !== "undefined";

function readFromStorage() {
  if (!hasWindow) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to parse admin session from storage", err);
    return null;
  }
}

function writeToStorage(session) {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    // Maintain backwards compatibility with older keys.
    if (session?.user) {
      window.localStorage.setItem("user", JSON.stringify(session.user));
    }
    if (session?.token) {
      window.localStorage.setItem("token", session.token);
    }
  } catch (err) {
    console.error("Failed to persist admin session", err);
  }
}

function removeFromStorage() {
  if (!hasWindow) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem("user");
  window.localStorage.removeItem("token");
}

export function setAdminSession(session) {
  if (!session || !session.user || !session.token) {
    throw new Error("setAdminSession requires { user, token }");
  }
  writeToStorage(session);
}

export function clearAdminSession() {
  removeFromStorage();
}

export function getAdminSession() {
  const session = readFromStorage();
  if (session?.user && session?.token) {
    return { ...session, devFallback: false };
  }

  if (process.env.NODE_ENV !== "production" && DEV_DEFAULT_TOKEN) {
    return {
      user: {
        email: "dev-admin@local",
        role: "SuperAdmin",
        name: "Dev Admin",
      },
      token: DEV_DEFAULT_TOKEN,
      devFallback: true,
    };
  }

  return null;
}

function ensureSession() {
  const session = getAdminSession();
  if (!session || !session.token) {
    const err = new Error("Missing admin session");
    err.code = "ADMIN_SESSION_MISSING";
    throw err;
  }
  return session;
}

export async function adminFetch(path, init = {}) {
  if (!path?.startsWith("/")) {
    throw new Error("adminFetch expects `path` to start with '/'");
  }

  const session = ensureSession();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...init,
    headers,
  });

  // Only clear session on 401 if response body indicates unauthorized
  if (response.status === 401) {
    try {
      const body = await response.clone().json().catch(() => ({}));
      if (body.error === "unauthorized" || body.error === "missing_bearer" || body.error === "invalid_token") {
        clearAdminSession();
        const err = new Error("Admin session expired");
        err.code = "ADMIN_SESSION_EXPIRED";
        throw err;
      }
    } catch (err) {
      // If it's already our error, re-throw it
      if (err.code === "ADMIN_SESSION_EXPIRED") throw err;
      // Otherwise, it might be a parsing error - don't clear session yet
    }
  }

  return response;
}

export { API_ORIGIN, STORAGE_KEY };


// src/services/workerClient.js
// Core worker client helpers: API base + auth token

// src/services/workerClient.js
// Core worker client helpers: API base + auth token

import { ensureSession } from "../backends/supabase/auth";

export const API_BASE =
  process.env.REACT_APP_HUBGATE_WORKER_BASE ||
  process.env.REACT_APP_HUBGATE_API_BASE ||
  "https://api.hubgate.ae";

export async function getAuthToken() {
  try {
    const session = await ensureSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error("Missing access token on active session");
    }

    return token;
  } catch (error) {
    console.error("Error fetching session for worker API:", error);
    // Let callers (e.g. getMe) handle lack of session/token explicitly
    throw error;
  }
}




/*
import { ensureSession } from "../backends/supabase/auth";

export const API_BASE =
  process.env.REACT_APP_HUBGATE_WORKER_BASE ||
  process.env.REACT_APP_HUBGATE_API_BASE ||
  "https://api.hubgate.ae";

export async function getAuthToken() {
  try {
    const session = await ensureSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("Missing access token on active session");
    }
    return token;
  } catch (error) {
    console.error("Error fetching session for worker API:", error);
    // Let callers (e.g. getMe) handle lack of session/token explicitly
    throw error;
  }
}
  */
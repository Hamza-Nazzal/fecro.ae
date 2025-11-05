// src/services/workerClient.js
// Core worker client helpers: API base + auth token

import { supabase } from "../backends/supabase";

export const API_BASE =
  process.env.REACT_APP_HUBGATE_WORKER_BASE ||
  process.env.REACT_APP_HUBGATE_API_BASE ||
  "https://api.hubgate.ae";

export async function getAuthToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error fetching session for worker API:", error);
    return "";
  }
  const token = data?.session?.access_token || "";
  return token;
}
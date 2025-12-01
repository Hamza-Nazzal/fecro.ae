// src/services/backends/supabase/auth.js
import { supabase } from '../supabase';





let _cachedUser;
let _userPromise = null;

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  _userPromise = null;
  _cachedUser = data?.user ?? null;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  _userPromise = null;
  _cachedUser = null;
  if (error) throw new Error(error.message);
  return true;
}

export async function getCurrentUserCached() {
  if (_cachedUser !== undefined) return _cachedUser;
  if (_userPromise) return _userPromise;

  _userPromise = supabase.auth.getSession()
    .then(({ data, error }) => {
      _userPromise = null;
      _cachedUser = error ? null : (data?.session?.user ?? null);
      return _cachedUser;
    })
    .catch(() => {
      _userPromise = null;
      _cachedUser = null;
      return _cachedUser;
    });

  return _userPromise;
}

/**
 * Waits for a Supabase session to exist by polling getSession().
 * @param {Object} options - Configuration options
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 10)
 * @param {number} options.delayMs - Delay between attempts in milliseconds (default: 300)
 * @returns {Promise<Session>} The session when it becomes available
 * @throws {Error} If no session is found after all attempts
 */
export async function ensureSession(options = {}) {
  const { maxAttempts = 10, delayMs = 300 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
    
    if (data?.session) {
      return data.session;
    }

    // Wait before next attempt (skip delay on last attempt)
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('No active session after waiting');
}

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null;
});

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

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null;
});

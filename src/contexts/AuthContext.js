//src/contexts/AuthContext.js


import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from '../services/backends/supabase';
import { getCurrentUserCached, signIn as authSignIn, signOut as authSignOut, ensureSession } from '../services/backends/supabase/auth';

const AuthContext = createContext({
  user: null,
  roles: [],
  loading: true,
  login: async (_email, _password) => {},
  logout: async () => {},
  setRoles: async (_roles) => {},
});

function toAppUser(u) {
  if (!u) return null;
  const roles = Array.isArray(u.user_metadata?.roles) ? u.user_metadata.roles : [];
  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || u.email || "User",
    roles,
  };
}

export function AuthProvider({ children }) {
  const [sessionUser, setSessionUser] = useState(null);
  const [session, setSession] = useState(null);
  const [roles, setRolesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedOnce = useRef(false);

  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;
      let alive = true;

  (async () => {
    try {
      const [u, { data }] = await Promise.all([
        getCurrentUserCached(),
        supabase.auth.getSession()
      ]);
      if (alive) {
        const roles = data?.session?.user?.user_metadata?.roles || [];
        setSessionUser(data?.session?.user ?? u);
        setSession(data?.session ?? null);
        setRolesState(roles);
      }
    } finally {
      if (alive) setLoading(false);
    }
  })();

  const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
    const roles = session?.user?.user_metadata?.roles || [];
    setSessionUser(session?.user ?? null);
    setSession(session ?? null);
    setRolesState(roles);
  });

  return () => {
    alive = false;
    sub?.subscription?.unsubscribe?.();
  };
}, []);


  // AuthContext.js (inside login)
const login = async (email, password) => {
  try {
    const data = await authSignIn({ email, password });

    setSessionUser(data?.user ?? null);

    // Immediately refresh session + roles so StartScreen makes correct decisions
    const { data: fresh, error: freshErr } = await supabase.auth.getSession();
    if (!freshErr) {
      setSession(fresh?.session ?? null);
      setRolesState(fresh?.session?.user?.user_metadata?.roles || []);
      setSessionUser(fresh?.session?.user ?? data?.user ?? null);
    }

    return data?.user ?? null;
  } catch (error) {
    throw error;
  }
};

  const logout = async () => {
    // Sign out from Supabase, but never redirect before cleanup.
    try {
      await authSignOut();
    } catch (e) {
      console.warn("signOut failed:", e);
    } finally {
      // Always clear local auth state.
      setSession(null);
      setSessionUser(null);
      setRolesState([]);
      // Keep existing post-logout destination.
      window.location.replace("/home");
    }
  };

  const setRoles = async (roles) => {
    const allowed = new Set(["buyer", "seller"]);
    const clean = Array.from(new Set((roles || []).map(String))).filter((r) =>
      allowed.has(r)
    );
    if (clean.length === 0) {
      throw new Error("Choose at least one role: buyer or seller");
    }

    // Ensure we have an active session before updating user metadata
    await ensureSession().catch((err) => {
      // Re-throw a clear error so callers can show a friendly message
      throw new Error(err?.message || "No active session – please sign in again");
    });

    const { data, error } = await supabase.auth.updateUser({ data: { roles: clean } });
    if (error) throw error;

    // After updating metadata, always refresh the latest session so roles are accurate
    const { data: fresh, error: freshErr } = await supabase.auth.getSession();

    if (freshErr) console.warn("Failed to refresh session after role update:", freshErr);

    const freshUser = fresh?.session?.user ?? data.user ?? null;

    setSessionUser(freshUser);
    setRolesState(freshUser?.user_metadata?.roles || []);

    return freshUser;
  };

  const value = useMemo(() => ({
      user: toAppUser(sessionUser),
      roles,
      loading,
      session,
      sessionReady: !loading && !!session,
      login,
      logout,
      setRoles,
    }),
    [sessionUser, roles, loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

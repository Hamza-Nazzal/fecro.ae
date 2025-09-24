// src/contexts/AuthContext.js


import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from '../services/backends/supabase';
import { getCurrentUserCached, signIn as authSignIn, signOut as authSignOut } from '../services/backends/supabase/auth';

const AuthContext = createContext({
  user: null,
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
  const [loading, setLoading] = useState(true);
  const mountedOnce = useRef(false);

  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;
      let alive = true;

  (async () => {
    try {
      const u = await getCurrentUserCached();
      if (alive) setSessionUser(u);
    } finally {
      if (alive) setLoading(false);
    }
  })();

  const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
    setSessionUser(session?.user ?? null);
  });

  return () => {
    alive = false;
    sub?.subscription?.unsubscribe?.();
  };
}, []);


  const login = async (email, password) => {
    try{
    const data = await authSignIn({ email, password }); 
    setSessionUser(data?.user ?? null);
    return data?.user ?? null;
  } catch (error) {
  
    throw error;
    }
  };

  const logout = async () => {
    
    try { await authSignOut(); } catch (e) { console.warn("signOut failed:", e); }

    setSessionUser(null);
  };

  const setRoles = async (roles) => {
    const allowed = new Set(["buyer", "seller"]);
    const clean = Array.from(new Set((roles || []).map(String))).filter(r => allowed.has(r));
    if (clean.length === 0) throw new Error("Choose at least one role: buyer or seller");

    const { data, error } = await supabase.auth.updateUser({ data: { roles: clean } });
    if (error) throw error;

    setSessionUser(data.user ?? null);
    return data.user ?? null;
  };

  const value = useMemo(() => ({
      user: toAppUser(sessionUser),
      loading,
      login,
      logout,
      setRoles,
    }),
    [sessionUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

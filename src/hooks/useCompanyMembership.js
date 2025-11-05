// src/hooks/useCompanyMembership.js
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Load the current user's company membership (if any) from Supabase.
 * This uses the user's JWT + RLS, no service key.
 */
export function useCompanyMembership() {
  const { user, supabaseClient } = useAuth();
  const [state, setState] = useState({
    status: "idle",       // "idle" | "loading" | "ready" | "error"
    company: null,        // { company_id } for now
    memberships: [],      // raw rows
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({
        status: "idle",
        company: null,
        memberships: [],
        error: null,
      });
      return;
    }

    let cancelled = false;

    async function load() {
      setState(prev => ({
        ...prev,
        status: "loading",
        error: null,
      }));

      const { data, error } = await supabaseClient
        .from("company_memberships")
        .select("company_id, track, role_level")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (error) {
        console.error("company_memberships load error", error);
        setState({
          status: "error",
          company: null,
          memberships: [],
          error,
        });
        return;
      }

      const memberships = Array.isArray(data) ? data : [];
      const primary = memberships[0] || null;

      setState({
        status: "ready",
        company: primary ? { company_id: primary.company_id } : null,
        memberships,
        error: null,
      });
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user, supabaseClient]);

  return state;
}
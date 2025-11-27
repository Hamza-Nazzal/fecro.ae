// src/components/CompanyGate.jsx

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/backends/supabase";

function useCompanyMembership() {
  const [state, setState] = useState({
    loading: true,
    hasCompany: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Supabase Auth session (RequireAuth already guarantees user is logged in)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelled) {
            setState({ loading: false, hasCompany: false, error: null });
          }
          return;
        }

        const { data, error } = await supabase
          .from("company_memberships")
          .select("company_id")
          .limit(1);

        if (cancelled) return;

        if (error) {
          setState({ loading: false, hasCompany: false, error });
          return;
        }

        const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
        const hasCompany = Boolean(row && row.company_id);

        setState({ loading: false, hasCompany, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          loading: false,
          hasCompany: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * CompanyGate
 *
 * Phase 6 – “company-aware” wrapper around buyer/seller routes.
 *
 * Current behavior:
 *   - Always renders children (no hard redirect yet).
 *   - While loading: just render children.
 *   - If user has no company membership: show a warning banner + children.
 *   - If there’s an error: show a small error banner + children.
 */
export default function CompanyGate({ children }) {
  const { loading, hasCompany, error } = useCompanyMembership();

  // While checking, just render children to avoid flicker
  if (loading) {
    return <>{children}</>;
  }

  // Hard redirect if no company membership
  if (!hasCompany && !error) {
    return <Navigate to="/onboarding/company" replace />;
  }

  // If error, still allow access but could show error banner if needed
  // For now, just render children
  return <>{children}</>;
}
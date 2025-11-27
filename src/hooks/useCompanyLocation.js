// src/hooks/useCompanyLocation.js
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/backends/supabase";
import { normalizeLocation } from "../utils/location/normalizeLocation";

// small helper so we don't treat { city:null, state:null, country:null } as "valid"
function hasLocationValue(loc) {
  if (!loc || typeof loc !== "object") return false;
  return ["city", "state", "country"].some((key) => {
    const value = loc[key];
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });
}

/**
 * Returns the current company location for the logged-in user, or null.
 * Shape: { city, state, country } | null
 */
export default function useCompanyLocation() {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // not logged in → no location
      if (!user) {
        if (!cancelled) setLocation(null);
        return;
      }

      // extra safety: if for any reason supabase isn’t ready, don’t crash
      if (!supabase || typeof supabase.from !== "function") {
        console.warn("[useCompanyLocation] Supabase client not ready", supabase);
        if (!cancelled) setLocation(null);
        return;
      }

      // 1) find the user’s company via company_memberships
      const { data: membership, error: membershipError } = await supabase
        .from("company_memberships")
        .select("company_id")
        .eq("user_id", user.id)
        .order("role_level", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      let companyId = membership?.company_id ?? null;

      // 2) optional fallback: try user metadata if no membership found
      if (!companyId) {
        const meta =
          user.raw_user_meta_data ||
          user.user_metadata ||
          {};
        companyId =
          meta.company_id ||
          meta.companyId ||
          meta.company ||
          null;
      }

      if (!companyId) {
        if (!cancelled) setLocation(null);
        return;
      }

      // 3) load the company row
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("city, state, country")
        .eq("id", companyId)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (companyError || !company) {
        console.warn("[useCompanyLocation] Failed to load company", companyError);
        setLocation(null);
        return;
      }

      const loc = normalizeLocation({
        city: company.city,
        state: company.state,
        country: company.country,
      });

      setLocation(hasLocationValue(loc) ? loc : null);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // IMPORTANT: we return the location object (or null), *not* a wrapper object
  return location;
}
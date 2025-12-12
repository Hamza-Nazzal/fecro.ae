//src/pages/StartScreen.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMe } from "../services/worker/workerCompany"; // same import style as CompanyOnboarding
import "./StartScreen.css";

export default function StartScreen() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [meLoading, setMeLoading] = useState(false);
  const [companyId, setCompanyId] = useState(undefined); // undefined=unknown, null=none, string=has
  const [meError, setMeError] = useState(false);

  // Load membership info once we have a user
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!user?.id) {
        setMeError(false);
        setMeLoading(false);
        setCompanyId(undefined);
        return;
      }
      setMeLoading(true);
      setMeError(false);
      try {
        const me = await getMe();
        if (!cancelled) setCompanyId(me?.company_id ?? null);
      } catch (_e) {
        if (!cancelled) {
          setMeError(true);
          setCompanyId(undefined);
        }
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;

    // 1) Not logged in
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

     // Wait for company lookup in progress
    if (meLoading) return;

    // Block redirects if getMe() failed
    if (meError) return;

    // Wait until we have a company result (unknown yet)
    if (companyId === undefined) return;

    // 2) Logged in but no company
    if (!companyId) {
      navigate("/onboarding/company", { replace: true });
      return;
    }

    // 3) Has company but no role
    if (!roles || roles.length === 0) {
      navigate("/choose-role", { replace: true });
      return;
    }

    // 4) Has company + role → ensure ?mode= is set, then redirect to appropriate dashboard
    const primary = roles[0]; // "buyer" or "seller"
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");

    if (mode !== primary) {
      navigate(`/start?mode=${primary}`, { replace: true });
      return;
    }

    // Mode matches, do final redirect
    if (primary === "buyer") {
      navigate("/buyer", { replace: true });
      return;
    } else {
      navigate("/seller", { replace: true });
      return;
    }
  }, [user, roles, loading, companyId, meLoading, meError, navigate, location.search]);

  return (
    <div className="start-screen">
      <div className="start-screen-content">
        <div className="logo-container">
          <img src="/logo/V2 4k.svg" alt="HubGate logo" className="start-logo" />
          <div className="logo-shine"></div>
        </div>
      </div>
    </div>
  );
}
import React from "react";

export default function AuthCallback() {
  React.useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    console.log("Auth callback params:", params);
    // Later: exchange codes / confirm signup using supabase-js here.
  }, []);
  return <div style={{ padding: 24 }}>Auth callback received. You can close this tab.</div>;
}

// src/pages/RoleChooser.jsx
/* See CODEGEN.md for architecture & conventions 
1	Page for multi-role users to choose Buyer or Seller.
	2	Calls switchRole then navigates to the right dashboard. Minimal glue page
*/

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function RoleChooser() {
  const { user, setRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const from = location.state?.from?.pathname || "/";

  async function choose(role) {
    setErr("");
    setSaving(true);
    try {
      await setRoles([role]);   // "buyer" or "seller"
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e?.message || "Failed to set role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-semibold mb-2">Choose your role</h1>
        <p className="text-sm text-gray-600 mb-4">
          Signed in as <strong>{user?.email}</strong>.
        </p>
        {err ? <p className="text-sm text-red-600 mb-3">{err}</p> : null}
        <div className="grid gap-3">
          <button
            className="rounded-lg border px-4 py-3 hover:bg-gray-50 text-left"
            disabled={saving}
            onClick={() => choose("buyer")}
          >
            <div className="font-medium">I’m a Buyer</div>
            <div className="text-sm text-gray-600">Create RFQs and receive quotations</div>
          </button>
          <button
            className="rounded-lg border px-4 py-3 hover:bg-gray-50 text-left"
            disabled={saving}
            onClick={() => choose("seller")}
          >
            <div className="font-medium">I’m a Seller</div>
            <div className="text-sm text-gray-600">Browse RFQs and send quotations</div>
          </button>
        </div>
      </div>
    </div>
  );
}
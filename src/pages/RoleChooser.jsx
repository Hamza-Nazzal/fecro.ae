// src/pages/RoleChooser.jsx
/* See CODEGEN.md for architecture & conventions 
1	Page for multi-role users to choose Buyer or Seller.
	2	Calls switchRole then navigates to the right dashboard. Minimal glue page
*/
import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

export default function RoleChooser() {
  const { user, setRoles } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const roleCopy = useMemo(
    () => ({
      buyer: {
        title: "I’m a Buyer",
        desc: "Create RFQs and receive quotations",
      },
      seller: {
        title: "I’m a Seller",
        desc: "Browse RFQs and send quotations",
      },
    }),
    []
  );

  async function confirm() {
    if (!selectedRole) return;
    setErr("");
    setSaving(true);
    try {
      await setRoles([selectedRole]);
      // Let StartScreen handle mode + final redirect
      navigate("/start", { replace: true });
    } catch (e) {
      setErr(e?.message || "Failed to set role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout title="Choose your role">
      <p className="text-sm text-gray-600 mb-4">
        Signed in as <strong>{user?.email}</strong>.
      </p>

      {err ? <p className="text-sm text-red-600 mb-3">{err}</p> : null}

      <fieldset className="grid gap-3" disabled={saving}>
        <legend className="sr-only">Select a role</legend>

        {["buyer", "seller"].map((role) => {
          const checked = selectedRole === role;
          return (
            <label
              key={role}
              className={[
                "rounded-lg border px-4 py-3 cursor-pointer select-none",
                "hover:bg-gray-50",
                checked ? "border-gray-900 ring-2 ring-gray-900/10" : "",
                saving ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={checked}
                  onChange={() => setSelectedRole(role)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{roleCopy[role].title}</div>
                  <div className="text-sm text-gray-600">{roleCopy[role].desc}</div>
                </div>
              </div>
            </label>
          );
        })}
      </fieldset>

      <button
        className="mt-4 w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-medium shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={saving || !selectedRole}
        onClick={confirm}
      >
        {saving
          ? "Saving…"
          : selectedRole
          ? `Confirm: ${selectedRole === "buyer" ? "Buyer" : "Seller"}`
          : "Select a role to continue"}
      </button>

      <p className="mt-3 text-xs text-gray-500 text-center">
        You can change this later from settings (if enabled).
      </p>
    </AuthLayout>
  );
}
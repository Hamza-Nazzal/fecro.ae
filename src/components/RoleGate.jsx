// src/components/RoleGate.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RoleGate({ require = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (roles.length === 0) {
    return <Navigate to="/choose-role" replace state={{ from: location }} />;
  }

  if (require.length && !require.some((r) => roles.includes(r))) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Access denied</h2>
        <p className="text-gray-700">This page requires: {require.join(" or ")}</p>
      </div>
    );
  }

  return children ?? <Outlet />;
}

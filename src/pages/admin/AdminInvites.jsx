// src/pages/admin/AdminInvites.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { adminFetch, getAdminSession } from '../../services/adminSession';

export function AdminInvitePanel() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("seller");
  const [status, setStatus] = React.useState(null);
  const [loadingAction, setLoadingAction] = React.useState(null);
  const [session] = React.useState(() => getAdminSession());

  React.useEffect(() => {
    if (!session) {
      navigate("/admin/login", { replace: true });
    }
  }, [session, navigate]);

  const handleAuthError = (error) => {
    if (
      error?.code === "ADMIN_SESSION_MISSING" ||
      error?.code === "ADMIN_SESSION_EXPIRED"
    ) {
      setStatus({
        type: "error",
        message: "Admin session missing or expired. Redirecting to login…",
      });
      setTimeout(() => navigate("/admin/login", { replace: true }), 500);
      return true;
    }
    return false;
  };

  const readResponsePayload = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const json = await response.json();
        return JSON.stringify(json, null, 2);
      } catch {
        // fall through to text
      }
    }
    return (await response.text()) || "(empty body)";
  };

  const whoami = async () => {
    setLoadingAction("whoami");
    setStatus({ type: "info", message: "Checking admin identity…" });
    try {
      const res = await adminFetch("/admin/whoami");
      const payload = await readResponsePayload(res);
      setStatus({
        type: res.ok ? "success" : "error",
        message: `${res.status} ${res.statusText || ""}\n${payload}`,
      });
    } catch (error) {
      if (handleAuthError(error)) return;
      setStatus({
        type: "error",
        message: error?.message || "Failed to fetch identity",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    setLoadingAction("invite");
    setStatus({ type: "info", message: "Sending invite…" });
    try {
      const res = await adminFetch("/admin/users.invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, roles: [role] }),
      });
      const payload = await readResponsePayload(res);
      setStatus({
        type: res.ok ? "success" : "error",
        message: `${res.status} ${res.statusText || ""}\n${payload}`,
      });
      if (res.ok) setEmail("");
    } catch (error) {
      if (handleAuthError(error)) return;
      setStatus({
        type: "error",
        message: error?.message || "Failed to send invite",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const infoBoxClasses = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-red-200 bg-red-50 text-red-900",
  };

  const statusClass =
    status?.type && infoBoxClasses[status.type]
      ? infoBoxClasses[status.type]
      : infoBoxClasses.info;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">
          Admin • Invite Users
        </h3>
        <p className="text-sm text-gray-500">
          Uses your current admin session—no bearer pasting needed.{" "}
          {session?.devFallback && (
            <span className="text-yellow-700 font-medium">
              Dev fallback token active.
            </span>
          )}
        </p>
      </div>

      {session?.user && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Signed in as{" "}
          <span className="font-semibold">{session.user.email}</span>{" "}
          ({session.user.role})
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={whoami}
          disabled={loadingAction === "whoami"}
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-black disabled:opacity-50"
        >
          {loadingAction === "whoami" ? "Checking…" : "Who am I?"}
        </button>
      </div>

      <form onSubmit={invite}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite email
            </label>
            <input
              type="email"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              disabled={loadingAction === "invite"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              disabled={loadingAction === "invite"}
            >
              <option value="seller">seller</option>
              <option value="buyer">buyer</option>
            </select>
          </div>
          <div className="self-end">
            <button
              type="submit"
              disabled={loadingAction === "invite" || !email}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {loadingAction === "invite" ? "Sending…" : "Send invite"}
            </button>
          </div>
        </div>
      </form>

      {status && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${statusClass}`}>
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {status.message}
          </pre>
        </div>
      )}
    </div>
  );
}

const AdminInvites = () => {
  const {
    activeMenu,
    setActiveMenu,
    stats
  } = useAdminDashboard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        stats={stats} 
      />
      <AdminHeader />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AdminInvitePanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminInvites;

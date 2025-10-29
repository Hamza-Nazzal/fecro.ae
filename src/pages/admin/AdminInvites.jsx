// src/pages/admin/AdminInvites.jsx
import React from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

export function AdminInvitePanel() {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("seller");
  const [msg, setMsg] = React.useState("");

  // Dev-only: paste your ADMIN_BEARER once and it stays in localStorage
  const getToken = () => localStorage.getItem("adminBearer") || "";

  const whoami = async () => {
    setMsg("Checking…");
    const res = await fetch("https://api.hubgate.ae/admin/whoami", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setMsg(`${res.status} ${await res.text()}`);
  };

  const invite = async (e) => {
    e.preventDefault();
    setMsg("Inviting…");
    const res = await fetch("https://api.hubgate.ae/admin/users.invite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, roles: [role] }),
    });
    setMsg(`${res.status} ${await res.text()}`);
  };

  return (
    <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <h3 style={{ marginBottom: 8 }}>Admin • Invite Users (dev)</h3>
      <div style={{ marginBottom: 8 }}>
        <label>Admin bearer (dev): </label>
        <input
          type="text"
          placeholder="paste ADMIN_BEARER once"
          onBlur={(e) => localStorage.setItem("adminBearer", e.target.value)}
          style={{ width: 360 }}
        />
        <button onClick={whoami} style={{ marginLeft: 8 }}>Who am I?</button>
      </div>
      <form onSubmit={invite}>
        <input
          type="email"
          placeholder="user@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: 320, marginRight: 8 }}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="seller">seller</option>
          <option value="buyer">buyer</option>
        </select>
        <button type="submit" style={{ marginLeft: 8 }}>Invite</button>
      </form>
      <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{msg}</pre>
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

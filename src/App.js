import React from "react";
import "./App.css";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import DualModeScreen from "./pages/DualModeScreen.jsx";
import LoginPage from "./pages/LoginPage";
import Products from "./pages/Products.jsx";
import Diag from "./pages/Diag.jsx";
import RoleChooser from "./pages/RoleChooser.jsx";
import AdminLogin from './pages/admin/adminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// NEW
import ToastProvider from "./components/Toasts.jsx";

// These routes were added earlier
import BuyerDashboard from "./components/BuyerDashboard.jsx";
import BuyerRFQDetail from "./components/BuyerRFQDetail.jsx";
import SellerQuoteComposer from "./components/SellerQuoteComposer.jsx";

function AfterLoginRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const roles = Array.isArray(user.roles) ? user.roles : [];

  if (roles.length === 0) return <Navigate to="/choose-role" replace />;
  if (roles.includes("buyer")) return <Navigate to="/buyer" replace />;
  if (roles.includes("seller")) return <Navigate to="/seller" replace />;

  return <Navigate to="/choose-role" replace />;
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function RequireAdminAuth({ children }) {
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  if (!storedUser || !storedToken) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  try {
    const user = JSON.parse(storedUser);
    if (user.role !== 'SuperAdmin') return <Navigate to="/admin/login" replace state={{ from: location }} />;
  } catch {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/start" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/start" element={<AfterLoginRedirect />} />
              <Route path="/__diag" element={<Diag />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <RequireAdminAuth>
                    <AdminDashboard />
                  </RequireAdminAuth>
                }
              />

              <Route
                path="/choose-role"
                element={
                  <RequireAuth>
                    <RoleChooser />
                  </RequireAuth>
                }
              />

              <Route
                path="/buyer"
                element={
                  <RequireAuth>
                    <DualModeScreen initialMode="buy" locked />
                  </RequireAuth>
                }
              />
              <Route
                path="/seller"
                element={
                  <RequireAuth>
                    <DualModeScreen initialMode="sell" locked />
                  </RequireAuth>
                }
              />

              {/* NEW routes kept from earlier steps */}
              <Route path="/buyer/rfqs" element={<RequireAuth><BuyerDashboard /></RequireAuth>} />
              <Route path="/buyer/rfq/:rfqId" element={<RequireAuth><BuyerRFQDetail /></RequireAuth>} />
              <Route path="/seller/quote/:rfqId" element={<RequireAuth><SellerQuoteComposer /></RequireAuth>} />

              <Route
                path="/products"
                element={
                  <RequireAuth>
                    <Products />
                  </RequireAuth>
                }
              />

              <Route path="*" element={<Navigate to="/start" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

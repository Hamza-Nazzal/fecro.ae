// src/App.js
import React from "react";
import "./App.css";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PreviewProvider } from "./contexts/PreviewContext";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import DualModeScreen from "./pages/DualModeScreen.jsx";
import DualModeScreenPreview from "./pages/DualModeScreenPreview.jsx";
import LoginPage from "./pages/LoginPage";
import Products from "./pages/Products.jsx";
import Diag from "./pages/Diag.jsx";
import RoleChooser from "./pages/RoleChooser.jsx";
import CompanyGate from "./components/CompanyGate";
import AdminLogin from './pages/admin/adminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInvites from './pages/admin/AdminInvites';
import AuthCallback from './pages/AuthCallback';
import { getAdminSession, clearAdminSession } from './services/adminSession';
import Signup from './pages/Signup';
import AcceptInvite from './pages/AcceptInvite';
import CompanyOnboarding from './pages/CompanyOnboarding';
import HomePage from './pages/HomePage';
import StartScreen from './pages/StartScreen';

// NEW
import ToastProvider from "./components/Toasts.jsx";
import PreviewToggle from "./components/PreviewToggle.jsx";

// These routes were added earlier
import BuyerDashboard from "./components/BuyerDashboard.jsx";
import BuyerRFQDetail from "./components/BuyerRFQDetail.jsx";
import SellerQuoteComposer from "./components/SellerQuoteComposer.jsx";
//


/*
console.log("[App] module loaded");
export default function App() {
  console.log("[App] render", window.location.pathname);
  return <div style={{padding:20}}>App minimal smoke</div>;   // TEMP
}
*/



console.log(process.env.REACT_APP_SELLER_HYDRATE_ENABLED); // should log "true"



function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function RequireAdminAuth({ children }) {
  const location = useLocation();
  const session = getAdminSession();
  if (!session || !session.user || session.user.role !== 'SuperAdmin') {
    clearAdminSession();
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PreviewProvider>
          <ToastProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/start" element={<StartScreen />} />
              <Route
                path="/onboarding/company"
                element={
                  <RequireAuth>
                    <CompanyOnboarding />
                  </RequireAuth>
                }
              />
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
                path="/admin/invites"
                element={
                  <RequireAdminAuth>
                    <AdminInvites />
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
                    <CompanyGate>
                      <DualModeScreen initialMode="buy" locked />
                    </CompanyGate>
                  </RequireAuth>
                }
              />

              <Route
                path="/seller"
                element={
                  <RequireAuth>
                    <CompanyGate>
                      <DualModeScreen initialMode="sell" locked />
                    </CompanyGate>
                  </RequireAuth>
                }
              />

              {/* Preview routes for UI redesign */}
              <Route
                path="/preview/buyer"
                element={
                  <RequireAuth>
                    <CompanyGate>
                      <DualModeScreenPreview initialMode="buy" locked />
                    </CompanyGate>
                  </RequireAuth>
                }
              />
              <Route
                path="/preview/seller"
                element={
                  <RequireAuth>
                    <CompanyGate>
                      <DualModeScreenPreview initialMode="sell" locked />
                    </CompanyGate>
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

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            <PreviewToggle />
          </BrowserRouter>
        </ToastProvider>
      </PreviewProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

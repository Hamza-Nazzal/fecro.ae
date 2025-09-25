// src/pages/DualModeScreenPreview.jsx
//src/pages/DualModeScreenPreview.jsx

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Package, ShoppingCart, Building2, Star, Menu, Eye
} from "lucide-react";
import useRFQ from "../hooks/useRFQ";
import BuyerQuotationsViewer from "../components/BuyerQuotationsViewer";
import SavedProductsContainer from "../containers/SavedProductsContainer";

// Imported components
import SideMenu from "../components/SideMenu.jsx";
import BuyerDashboard from "../components/BuyerDashboard.jsx";
import SellerDashboardPreview from "../components/SellerDashboardPreview.jsx"; // Preview version
import RequestForm from "../components/RequestForm.jsx";
import QuotationModal from "../components/QuotationModal.jsx";

const INITIAL_NEW_REQUEST = {
  barcode: "",
  title: "",
  description: "",
  category: "",
  subCategory: "",
  categoryId: null,
  categoryPath: "",
  quantity: "",
  deliveryTime: "today",
  customDate: "",
  orderType: "one-time",
  // keep these present; values don't matter while disabled
  delivery: null,
  warranty: null,
  installation: null,
};

export default function DualModeScreenPreview({ initialMode = "buy", locked = false }) {
  const { user, logout } = useAuth();               // pulled from AuthContext; router should protect this screen
  const [mode, setMode] = useState(initialMode);    // lockable
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const topRef = useRef(null);
  const [viewingQuotations, setViewingQuotations] = useState(null);

  const userDisplayName = user?.name || user?.email || "User";
  const userRating = typeof user?.rating === "number" ? user.rating : 4.8;

  // Hook (always call; it doesn't require user)
  const {
    buyRequests, setBuyRequests,
    newRequest, setNewRequest,
    selectedRequest, setSelectedRequest,
    quotation, setQuotation,
    editingRequestId, setEditingRequestId,
    handleRequestStatusChange,
    handleEditRequest,
    handleSubmitRequest,
    handleSendQuotation,
  } = useRFQ({ user });

  // SAFETY: ensure RequestForm never receives undefined
  const safeNewRequest = newRequest ?? INITIAL_NEW_REQUEST;

  // Seed a new request the first time we enter the "create" tab if none exists yet.
  useEffect(() => {
    if (activeTab === "create") {
      setNewRequest(prev => prev ?? { ...INITIAL_NEW_REQUEST });
    }
  }, [activeTab, setNewRequest]);

  // Scroll to top when returning to dashboard
  useEffect(() => {
    if (activeTab === "dashboard") {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  }, [activeTab]);

  if (!user) {
    // Screen expects an authenticated user; router should handle redirect to /login
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Side Menu */}
      <SideMenu 
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        onLogout={logout}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <button onClick={() => setSideMenuOpen(true)} className="mr-3 p-1 hover:bg-gray-100 rounded">
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <Building2 className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-bold text-gray-900">Fecro</h1>
              {/* Preview Badge */}
              <div className="ml-2 flex items-center bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm text-gray-600">{userRating}</span>
              </div>
            </div>
          </div>

          {/* Mode Toggle (hidden if locked) */}
          {!locked && (
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-full">
              <button
                onClick={() => !locked && setMode("buy")}
                className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                  mode === "buy" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600"
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy
              </button>
              <button
                onClick={() => !locked && setMode("sell")}
                className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                  mode === "sell" ? "bg-green-600 text-white shadow-sm" : "text-gray-600"
                }`}
              >
                <Package className="h-4 w-4 mr-1" />
                Sell
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Welcome Banner with Preview Notice */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-3">
        <p className="text-sm">Welcome, {userDisplayName} - UI Preview Mode</p>
      </div>

      <div className="px-4 py-4">
        <span ref={topRef} className="block h-0 scroll-mt-24" />
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-3 rounded-md font-medium text-xs flex-1 text-center transition-colors ${
                activeTab === "dashboard" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {mode === "buy" ? "My Requests" : "Browse"}
            </button>
            <button
              onClick={() => {
                // proactively seed state before render (extra safety)
                setNewRequest(prev => prev ?? { ...INITIAL_NEW_REQUEST });
                setActiveTab("create");
              }}
              className={`py-2 px-3 rounded-md font-medium text-xs flex-1 text-center transition-colors ${
                activeTab === "create" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {mode === "buy" ? "Request For Quotation" : "My Quotations"}
            </button>
            <button
              onClick={() => setActiveTab("SavedProducts")}
              className={`py-2 px-3 rounded-md font-medium text-xs flex-1 text-center transition-colors ${
                activeTab === "SavedProducts" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              }`}
            >
              Products
            </button>
          </nav>
        </div>

        {/* Buy Mode Content */}
        {mode === "buy" && (
          <>
            {activeTab === "dashboard" && (
              <BuyerDashboard
                buyRequests={buyRequests}
                userDisplayName={userDisplayName}
                onCreateNew={() => {
                  setNewRequest(prev => prev ?? { ...INITIAL_NEW_REQUEST });
                  setActiveTab("create");
                }}
                onViewQuotations={(request) => setViewingQuotations(request)}
                onRequestStatusChange={handleRequestStatusChange}
                onEditRequest={(requestId) => {
                  handleEditRequest(requestId);
                  setActiveTab("create");
                }}
                onDeleteRequest={(requestId) => 
                  setBuyRequests((prev) => prev.filter((req) => req.id !== requestId))
                }
              />
            )}

            {activeTab === "create" && (
              <RequestForm
                newRequest={safeNewRequest}
                setNewRequest={setNewRequest}
                editingRequestId={editingRequestId}
                INITIAL_NEW_REQUEST={INITIAL_NEW_REQUEST}
                onCancel={() => {
                  setNewRequest({ ...INITIAL_NEW_REQUEST });
                  setEditingRequestId(null);
                  setActiveTab("dashboard");
                }}
                onSubmit={() => {
                  const ok = handleSubmitRequest();
                  if (ok) {
                    setNewRequest({ ...INITIAL_NEW_REQUEST });
                    setActiveTab("dashboard");
                  }
                }}
              />
            )}
          </>
        )}

        {/* Sell Mode Content - Using Preview Dashboard */}
        {mode === "sell" && (
          <SellerDashboardPreview activeTab={activeTab} />
        )}

        {/* SavedProducts Tab */}
        {activeTab === "SavedProducts" && <SavedProductsContainer mode={mode} />}
        
        {/* Buyer Quotations Viewer Modal */}
        {viewingQuotations && (
          <BuyerQuotationsViewer
            rfq={viewingQuotations}
            onClose={() => setViewingQuotations(null)}
          />
        )}
      </div>

      {/* Quotation Modal (used by older flow; kept) */}
      <QuotationModal
        selectedRequest={selectedRequest}
        quotation={quotation}
        setQuotation={setQuotation}
        onClose={() => setSelectedRequest(null)}
        onSendQuotation={() => {
          const ok = handleSendQuotation();
          if (ok) setSelectedRequest(null);
        }}
      />
    </div>
  );
}

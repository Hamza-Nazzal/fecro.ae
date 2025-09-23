//src/components/SellerDashboard.jsx
import React from "react";
import SellerRFQsInline from "./SellerRFQsInline.jsx";
import SellerQuotationsTab from "./SellerQuotationsTab.jsx";

export default function SellerDashboard({ activeTab }) {
  if (activeTab === "dashboard") {
    return <SellerRFQsInline />;
  }
  
  if (activeTab === "create") {
    return <SellerQuotationsTab />;
  }
  
  return null;
}
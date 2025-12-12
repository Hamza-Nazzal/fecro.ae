//src/layouts/AuthLayout.jsx

import React from "react";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Anchor area: 20% from top */}
      <div className="flex flex-col items-center pt-[8vh] pb-6">
        <img
          src="/logo/V2NoBackGround.png"
          alt="HubGate Logo"
          className="w-24 h-24 mb-4 object-contain drop-shadow-sm"
        />

        <h1 className="text-3xl font-semibold text-gray-900">HubGate</h1>

        <p className="text-sm text-gray-500 mt-1">
          B2B Marketplace for Office & Facility Supplies
        </p>
      </div>

      {/* Card container (centered, always same position) */}
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl p-8">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mb-5">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}


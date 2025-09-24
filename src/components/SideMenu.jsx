// src/components/SideMenu.jsx
//src/components/SideMenu.jsx
import React from "react";
import {
  User, Clock, Wallet, HelpCircle, FileText, LogOut, X
} from "lucide-react";

export default function SideMenu({ isOpen, onClose, onLogout }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Menu</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <User className="h-5 w-5 mr-3" />
            Profile
          </button>
          <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Clock className="h-5 w-5 mr-3" />
            History
          </button>
          <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors opacity-50 cursor-not-allowed">
            <Wallet className="h-5 w-5 mr-3" />
            Wallet (Coming Soon)
          </button>
          <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="h-5 w-5 mr-3" />
            Help
          </button>
          <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FileText className="h-5 w-5 mr-3" />
            Terms & Conditions
          </button>
          <hr className="my-4" />
          <button
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { menuItems } from '../../data/adminDashboardData';

const AdminSidebar = ({ activeMenu, setActiveMenu, stats }) => {
  const menuItemsList = menuItems(stats);

  return (
    <div className="fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-200 w-64 z-40">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">MarketPlace Admin</h1>
        <p className="text-xs text-gray-500">Control Panel</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItemsList.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeMenu === item.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;

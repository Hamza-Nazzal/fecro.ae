// src/components/admin/DashboardOverview.jsx
import React from 'react';

const DashboardOverview = ({ stats, dashboardData }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Good morning, Admin</h1>
          <p className="text-gray-600">Here's what's happening on your marketplace today</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
          <h3 className="text-blue-600 text-sm font-medium mb-1">Platform Users</h3>
          <p className="text-3xl font-bold text-blue-900 mb-1">{stats.totalUsers}</p>
          <p className="text-sm text-blue-600">{stats.activeUsers} active this month</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
          <h3 className="text-green-600 text-sm font-medium mb-1">Active RFQs</h3>
          <p className="text-3xl font-bold text-green-900 mb-1">{stats.activeRFQs}</p>
          <p className="text-sm text-green-600">Out of {stats.totalRFQs} total</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
          <h3 className="text-purple-600 text-sm font-medium mb-1">Quote Responses</h3>
          <p className="text-3xl font-bold text-purple-900 mb-1">{stats.totalQuotations}</p>
          <p className="text-sm text-purple-600">{stats.pendingQuotations} awaiting review</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
          <h3 className="text-orange-600 text-sm font-medium mb-1">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-orange-900 mb-1">{stats.monthlyRevenue}</p>
          <p className="text-sm text-orange-600">Success rate: {stats.successRate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent RFQ Activity</h3>
          <div className="space-y-4">
            {dashboardData.rfqs.map(rfq => (
              <div key={rfq.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium ${
                    rfq.priority === 'High' ? 'bg-red-500' : 
                    rfq.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {rfq.buyer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {rfq.buyer} • {rfq.product}
                    </p>
                    <p className="text-sm text-gray-500">{rfq.responses} responses • {rfq.category}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rfq.status === 'Active' ? 'bg-green-100 text-green-700' :
                  rfq.status === 'Closed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {rfq.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Insights</h3>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
              <p className="text-sm text-blue-600 font-medium">Avg Response Time</p>
              <p className="text-2xl font-bold text-blue-900">{stats.averageResponseTime}</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Top Categories</h4>
              {dashboardData.categories.map((category, index) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">{category.name}</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">{category.growth}</span>
                </div>
              ))}
            </div>

            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium">
              Generate Detailed Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

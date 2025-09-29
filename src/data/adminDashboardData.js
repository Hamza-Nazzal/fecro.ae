// src/data/adminDashboardData.js
import React from 'react';

export const dashboardData = {
  users: [
    { id: 1, name: 'TechCorp Ltd', email: 'procurement@techcorp.com', role: 'Buyer', status: 'Active', joinDate: '2024-01-15', orders: 12, verified: true, tier: 'Enterprise' },
    { id: 2, name: 'ElectroSupply Inc', email: 'sales@electrosupply.com', role: 'Supplier', status: 'Active', joinDate: '2024-01-10', orders: 28, verified: true, tier: 'Premium' },
    { id: 3, name: 'Manufacturing Co', email: 'orders@mfgco.com', role: 'Buyer', status: 'Pending', joinDate: '2024-02-01', orders: 3, verified: false, tier: 'Standard' }
  ],
  categories: [
    { id: 1, name: 'Electronics & Components', description: 'Electronic devices, components and accessories', productCount: 1247, status: 'Active', trending: true, growth: '+12%' },
    { id: 2, name: 'Industrial Machinery', description: 'Manufacturing equipment and industrial machines', productCount: 856, status: 'Active', trending: false, growth: '+5%' }
  ],
  rfqs: [
    { id: 1, buyer: 'TechCorp Ltd', supplier: 'Multiple Suppliers', product: 'Custom PCB Assembly', quantity: 1000, status: 'Active', date: '2024-09-20', budget: '$25,000 - $35,000', responses: 7, priority: 'High', category: 'Electronics' },
    { id: 2, buyer: 'Manufacturing Co', supplier: 'Specialized Suppliers', product: 'Industrial Sensors', quantity: 250, status: 'Closed', date: '2024-09-18', budget: '$15,000 - $20,000', responses: 12, priority: 'Medium', category: 'Industrial' }
  ],
  quotations: [
    { id: 1, buyer: 'TechCorp Ltd', supplier: 'ElectroSupply Inc', amount: '$28,500', status: 'Submitted', validUntil: '2024-10-20', submittedDate: '2024-09-21', confidence: 85 },
    { id: 2, buyer: 'Manufacturing Co', supplier: 'Industrial Parts Pro', amount: '$17,200', status: 'Accepted', validUntil: '2024-10-25', submittedDate: '2024-09-19', confidence: 92 }
  ],
  staff: [
    { id: 1, name: 'Sarah Chen', email: 'sarah.chen@marketplace.com', role: 'Platform Manager', department: 'Operations', status: 'Active', salary: '$95,000', avatar: 'SC', performance: 'Excellent' },
    { id: 2, name: 'Marcus Rodriguez', email: 'marcus.r@marketplace.com', role: 'Compliance Specialist', department: 'Legal', status: 'Active', salary: '$78,000', avatar: 'MR', performance: 'Good' }
  ]
};

export const calculateStats = (data) => ({
  totalUsers: data.users.length,
  activeUsers: data.users.filter(u => u.status === 'Active').length,
  totalRFQs: data.rfqs.length,
  activeRFQs: data.rfqs.filter(r => r.status === 'Active').length,
  totalQuotations: data.quotations.length,
  pendingQuotations: data.quotations.filter(q => q.status === 'Submitted').length,
  monthlyRevenue: '$324,580',
  growthRate: '+23.5%',
  averageResponseTime: '2.3 hours',
  successRate: '87.3%'
});

export const menuItems = (stats) => [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users', badge: stats.totalUsers - stats.activeUsers },
  { id: 'categories', label: 'Categories' },
  { id: 'rfqs', label: 'RFQ Monitor', badge: stats.activeRFQs },
  { id: 'quotations', label: 'Quote Responses', badge: stats.pendingQuotations },
  { id: 'staff', label: 'Team' }
];

export const columnDefinitions = {
  userColumns: [
    { 
      key: 'name', 
      label: 'Company Name',
      render: (item) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.tier} Tier</p>
          </div>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Type',
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.role === 'Buyer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {item.role}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.status === 'Active' ? 'bg-green-100 text-green-700' : 
          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {item.status}
        </span>
      )
    },
    { key: 'orders', label: 'Transactions' },
    { 
      key: 'verified', 
      label: 'Verified',
      render: (item) => (
        <span className={`${item.verified ? 'text-green-500' : 'text-red-500'}`}>
          {item.verified ? '✓' : '✕'}
        </span>
      )
    }
  ],
  basicColumns: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' }
  ],
  rfqColumns: [
    { key: 'buyer', label: 'Buyer' },
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'status', label: 'Status' },
    { key: 'responses', label: 'Responses' }
  ],
  quotationColumns: [
    { key: 'supplier', label: 'Supplier' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'confidence', label: 'Success Rate' }
  ],
  staffColumns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    { key: 'performance', label: 'Performance' }
  ]
};

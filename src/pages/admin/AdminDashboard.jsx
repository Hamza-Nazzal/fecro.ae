import React, { useState } from 'react';

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const dashboardData = {
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

  const stats = {
    totalUsers: dashboardData.users.length,
    activeUsers: dashboardData.users.filter(u => u.status === 'Active').length,
    totalRFQs: dashboardData.rfqs.length,
    activeRFQs: dashboardData.rfqs.filter(r => r.status === 'Active').length,
    totalQuotations: dashboardData.quotations.length,
    pendingQuotations: dashboardData.quotations.filter(q => q.status === 'Submitted').length,
    monthlyRevenue: '$324,580',
    growthRate: '+23.5%',
    averageResponseTime: '2.3 hours',
    successRate: '87.3%'
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users', badge: dashboardData.users.filter(u => u.status === 'Pending').length },
    { id: 'categories', label: 'Categories' },
    { id: 'rfqs', label: 'RFQ Monitor', badge: stats.activeRFQs },
    { id: 'quotations', label: 'Quote Responses', badge: stats.pendingQuotations },
    { id: 'staff', label: 'Team' }
  ];

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType('');
  };

  const handleSave = () => {
    console.log('Saving:', modalType);
    closeModal();
  };

  const handleDelete = (type, id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      console.log('Deleting:', type, id);
    }
  };

  const DashboardOverview = () => (
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

  const DataTable = ({ data, columns, type, title }) => {
    const filteredData = data.filter(item => 
      Object.values(item).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 mt-1">{filteredData.length} total items</p>
            </div>
            
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Search..."
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                onClick={() => openModal(`add-${type}`)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Add New
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(column => (
                  <th key={column.key} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                  {columns.map(column => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => openModal(`view-${type}`, item)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => openModal(`edit-${type}`, item)}
                        className="px-3 py-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(type, item.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    );
  };

  const Modal = () => {
    if (!showModal) return null;

    const isView = modalType.startsWith('view-');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {modalType.startsWith('view-') && 'View'} 
                {modalType.startsWith('edit-') && 'Edit'} 
                {modalType.startsWith('add-') && 'Add New'} 
                {modalType.split('-')[1]?.charAt(0).toUpperCase() + modalType.split('-')[1]?.slice(1)}
              </h3>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input 
                    type="text" 
                    defaultValue={selectedItem?.name || ''}
                    disabled={isView}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    defaultValue={selectedItem?.email || ''}
                    disabled={isView}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    defaultValue={selectedItem?.status || ''}
                    disabled={isView}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select 
                    defaultValue={selectedItem?.role || ''}
                    disabled={isView}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {!isView && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-colors">
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const userColumns = [
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
    ];

    const basicColumns = [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status' }
    ];

    switch (activeMenu) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <DataTable data={dashboardData.users} type="user" title="Platform Users" columns={userColumns} />;
      case 'categories':
        return <DataTable data={dashboardData.categories} type="category" title="Product Categories" columns={basicColumns} />;
      case 'rfqs':
        return <DataTable data={dashboardData.rfqs} type="rfq" title="RFQ Marketplace Monitoring" columns={[
          { key: 'buyer', label: 'Buyer' },
          { key: 'product', label: 'Product' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'status', label: 'Status' },
          { key: 'responses', label: 'Responses' }
        ]} />;
      case 'quotations':
        return <DataTable data={dashboardData.quotations} type="quotation" title="Quote Response Monitoring" columns={[
          { key: 'supplier', label: 'Supplier' },
          { key: 'buyer', label: 'Buyer' },
          { key: 'amount', label: 'Amount' },
          { key: 'status', label: 'Status' },
          { key: 'confidence', label: 'Success Rate' }
        ]} />;
      case 'staff':
        return <DataTable data={dashboardData.staff} type="staff" title="Team Management" columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'department', label: 'Department' },
          { key: 'status', label: 'Status' },
          { key: 'performance', label: 'Performance' }
        ]} />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-200 w-64 z-40">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">MarketPlace Admin</h1>
          <p className="text-xs text-gray-500">Control Panel</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
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

      {/* Header */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-white bg-opacity-90 backdrop-blur-lg shadow-sm border-b border-gray-200 z-30">
        <div className="h-full px-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg relative">
              🔔
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                A
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal />
    </div>
  );
};

export default AdminDashboard;
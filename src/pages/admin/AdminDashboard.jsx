// src/pages/admin/AdminDashboard.jsx
import React from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { columnDefinitions } from '../../data/adminDashboardData';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import DashboardOverview from '../../components/admin/DashboardOverview';
import DataTable from '../../components/admin/DataTable';
import AdminModal from '../../components/admin/AdminModal';
import { AdminInvitePanel } from './AdminInvites';

const AdminDashboard = () => {
  const {
    activeMenu,
    setActiveMenu,
    showModal,
    modalType,
    selectedItem,
    searchTerm,
    setSearchTerm,
    stats,
    dashboardData,
    openModal,
    closeModal,
    handleSave,
    handleDelete
  } = useAdminDashboard();




  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardOverview stats={stats} dashboardData={dashboardData} />;
      case 'users':
        return (
          <DataTable 
            data={dashboardData.users} 
            type="user" 
            title="Platform Users" 
            columns={columnDefinitions.userColumns}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            openModal={openModal}
            handleDelete={handleDelete}
          />
        );
      case 'categories':
        return (
          <DataTable 
            data={dashboardData.categories} 
            type="category" 
            title="Product Categories" 
            columns={columnDefinitions.basicColumns}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            openModal={openModal}
            handleDelete={handleDelete}
          />
        );
      case 'rfqs':
        return (
          <DataTable 
            data={dashboardData.rfqs} 
            type="rfq" 
            title="RFQ Marketplace Monitoring" 
            columns={columnDefinitions.rfqColumns}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            openModal={openModal}
            handleDelete={handleDelete}
          />
        );
      case 'quotations':
        return (
          <DataTable 
            data={dashboardData.quotations} 
            type="quotation" 
            title="Quote Response Monitoring" 
            columns={columnDefinitions.quotationColumns}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            openModal={openModal}
            handleDelete={handleDelete}
          />
        );
      case 'staff':
        return (
          <DataTable 
            data={dashboardData.staff} 
            type="staff" 
            title="Team Management" 
            columns={columnDefinitions.staffColumns}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            openModal={openModal}
            handleDelete={handleDelete}
          />
        );
      case 'invites':
        return <AdminInvitePanel />;
      default:
        return <DashboardOverview stats={stats} dashboardData={dashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        stats={stats} 
      />
      <AdminHeader />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      <AdminModal 
        showModal={showModal}
        modalType={modalType}
        selectedItem={selectedItem}
        closeModal={closeModal}
        handleSave={handleSave}
      />
    </div>
  );
};

export default AdminDashboard;
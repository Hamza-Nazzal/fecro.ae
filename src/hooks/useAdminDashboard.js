// src/hooks/useAdminDashboard.js
import { useState } from 'react';
import { dashboardData, calculateStats } from '../data/adminDashboardData';

export const useAdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const stats = calculateStats(dashboardData);

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

  return {
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
  };
};

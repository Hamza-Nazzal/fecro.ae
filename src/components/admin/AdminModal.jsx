// src/components/admin/AdminModal.jsx
import React from 'react';

const AdminModal = ({ showModal, modalType, selectedItem, closeModal, handleSave }) => {
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

export default AdminModal;

// src/components/PreviewToggle.jsx
//src/components/PreviewToggle.jsx
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { usePreview } from '../contexts/PreviewContext';

export default function PreviewToggle() {
  const { 
    isPreviewMode, 
    togglePreviewMode, 
    previewFeatures, 
    toggleFeature,
    enableAllFeatures,
    disableAllFeatures 
  } = usePreview();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">UI Preview</h3>
          <button
            onClick={togglePreviewMode}
            className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
              isPreviewMode 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isPreviewMode ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            {isPreviewMode ? 'Preview On' : 'Preview Off'}
          </button>
        </div>

        {isPreviewMode && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600 mb-2">
              Toggle individual features:
            </div>
            
            <div className="space-y-1">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={previewFeatures.newSellerDashboard}
                  onChange={() => toggleFeature('newSellerDashboard')}
                  className="mr-2 rounded"
                />
                New Seller Dashboard
              </label>
              
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={previewFeatures.newBuyerDashboard}
                  onChange={() => toggleFeature('newBuyerDashboard')}
                  className="mr-2 rounded"
                />
                New Buyer Dashboard
              </label>
              
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={previewFeatures.newUIComponents}
                  onChange={() => toggleFeature('newUIComponents')}
                  className="mr-2 rounded"
                />
                New UI Components
              </label>
            </div>

            <div className="flex space-x-1 pt-2 border-t border-gray-100">
              <button
                onClick={enableAllFeatures}
                className="flex-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
              >
                Enable All
              </button>
              <button
                onClick={disableAllFeatures}
                className="flex-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded hover:bg-gray-200 transition-colors"
              >
                Disable All
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              <p>Preview routes:</p>
              <p>• /preview/buyer</p>
              <p>• /preview/seller</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

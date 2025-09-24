// src/contexts/PreviewContext.js
//src/contexts/PreviewContext.js
import React, { createContext, useContext, useState } from 'react';

const PreviewContext = createContext();

export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
};

export const PreviewProvider = ({ children }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewFeatures, setPreviewFeatures] = useState({
    newSellerDashboard: false,
    newBuyerDashboard: false,
    newUIComponents: false,
  });

  const togglePreviewMode = () => {
    setIsPreviewMode(prev => !prev);
  };

  const toggleFeature = (featureName) => {
    setPreviewFeatures(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }));
  };

  const enableAllFeatures = () => {
    setPreviewFeatures({
      newSellerDashboard: true,
      newBuyerDashboard: true,
      newUIComponents: true,
    });
  };

  const disableAllFeatures = () => {
    setPreviewFeatures({
      newSellerDashboard: false,
      newBuyerDashboard: false,
      newUIComponents: false,
    });
  };

  const value = {
    isPreviewMode,
    setIsPreviewMode,
    previewFeatures,
    setPreviewFeatures,
    togglePreviewMode,
    toggleFeature,
    enableAllFeatures,
    disableAllFeatures,
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
};

import { useEffect, useState, useRef } from 'react';

export const useRFQUIFlags = ({ currentStep, currentItem }) => {
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showVariantMatrix, setShowVariantMatrix] = useState(false);
  const [showSupplierPreview, setShowSupplierPreview] = useState(false);
  const [basicsExpanded, setBasicsExpanded] = useState(true);
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const didAutoExpand = useRef(false);

  useEffect(() => {
    if (currentStep !== 1) return;
    if (didAutoExpand.current) return;
    const nameOk = (currentItem?.productName || "").trim().length >= 2;
    const catOk = !!currentItem?.categoryCommitted;
    if (basicsExpanded && nameOk && catOk) {
      didAutoExpand.current = true;
      setBasicsExpanded(false);
      setSpecsExpanded(true);
    }
  }, [currentStep, basicsExpanded, currentItem?.productName, currentItem?.categoryCommitted]);

  return {
    showMobileCart, setShowMobileCart,
    showVariantMatrix, setShowVariantMatrix,
    showSupplierPreview, setShowSupplierPreview,
    basicsExpanded, setBasicsExpanded,
    specsExpanded, setSpecsExpanded,
    didAutoExpand,
  };
};

//src/components/rfq-form/useRFQForm.js

import { useCallback, useState } from "react";
import {
  BLANK_ITEM, BLANK_ORDER, defaultRecommended,
  isBasicsValid as _isBasicsValid, canSaveItem as _canSaveItem, canProceedStep2 as _canProceedStep2,
  makeAddOrUpdateItem, makeEditItem, makeDuplicateItem, makeRemoveItem,
  makeUpdateOrderDetails,
  useRFQNavigation,
  useRFQUIFlags,
  makeSubmitRFQ,
} from "./form";

export default function useRFQForm() {
  // core state
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(BLANK_ITEM);
  const [orderDetails, setOrderDetails] = useState(BLANK_ORDER);
  const [submitted, setSubmitted] = useState(false);
  const [rfqId, setRfqId] = useState(null);

  // ui flags (includes auto-expand effect)
  const {
    showMobileCart, setShowMobileCart,
    showVariantMatrix, setShowVariantMatrix,
    showSupplierPreview, setShowSupplierPreview,
    basicsExpanded, setBasicsExpanded,
    specsExpanded, setSpecsExpanded,
    didAutoExpand,
  } = useRFQUIFlags({ currentStep, currentItem });

  // validators & guards (pure)
  const isBasicsValid = useCallback(() => _isBasicsValid(currentItem), [currentItem]);
  const canSaveItem   = useCallback(() => _canSaveItem(currentItem), [currentItem]);
  const canProceedStep1 = useCallback(() => items.length > 0 || _canSaveItem(currentItem), [items.length, currentItem]);
  const canProceedStep2 = useCallback(() => _canProceedStep2(items, orderDetails), [items, orderDetails]);

  // navigation
  const { goNext, goBack, canGoTo, goTo } = useRFQNavigation({
    canProceedStep1, canProceedStep2, currentStep, setCurrentStep
  });

  // actions (stateful factories)
  const getCurrentItem = () => currentItem;
  const getItems = () => items;
  const addOrUpdateItem = makeAddOrUpdateItem({
    getCurrentItem, setItems, setCurrentItem, setBasicsExpanded, setSpecsExpanded, didAutoExpandRef: didAutoExpand
  });
  const editItem      = makeEditItem({ getItems, setCurrentItem, setBasicsExpanded, setSpecsExpanded, setCurrentStep, didAutoExpandRef: didAutoExpand });
  const duplicateItem = makeDuplicateItem({ getItems, setItems });
  const removeItem    = makeRemoveItem({ setItems });
  const updateOrderDetails = makeUpdateOrderDetails({ setOrderDetails });

  // submit
  const getState = () => ({ submitting, orderDetails, items, rfqId });
  const submitRFQ = makeSubmitRFQ({ getState, setSubmitting, setSubmitError, setRfqId, setSubmitted });

  // misc
  const recommendedFor = useCallback((category) => defaultRecommended(category), []);

  return {
    // navigation
    currentStep, goNext, goBack, canGoTo, goTo,
    // UI flags
    showMobileCart, setShowMobileCart,
    showVariantMatrix, setShowVariantMatrix,
    showSupplierPreview, setShowSupplierPreview,
    basicsExpanded, setBasicsExpanded,
    specsExpanded, setSpecsExpanded,
    // RFQ data
    items, currentItem, orderDetails, submitted, rfqId,
    // actions
    updateCurrentItem: (patch) => setCurrentItem((prev) => ({ ...prev, ...patch })),
    commitCategory: (label) => setCurrentItem((prev) => ({ ...prev, category: label || "", categoryCommitted: !!label })),
    addOrUpdateItem, editItem, duplicateItem, removeItem,
    updateOrderDetails,
    setItems, // Expose setItems for direct updates
    // validators & guards
    isBasicsValid, canSaveItem, canProceedStep1, canProceedStep2,
    // submission
    submitRFQ, submitting, submitError,
    // misc
    recommendedFor,
  };
}
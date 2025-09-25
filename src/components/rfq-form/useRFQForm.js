// src/components/rfq-form/useRFQForm.js
import { useCallback, useEffect, useRef, useState } from "react";
import { createRFQ, updateRFQ } from "../../services/rfqService";

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const BLANK_ITEM = {
  id: null,
  productName: "",
  category: "",
  categoryCommitted: false,
  barcode: "",
  specifications: {},
  quantity: "",
  purchaseType: "one-time",
};

const BLANK_ORDER = {
  deliveryTimeline: "standard",
  customDate: "",
  incoterms: "EXW",
  paymentTerms: "net-30",
  quoteDeadline: "",
  internalRef: "",
};

const defaultRecommended = (category = "") => {
  const c = category.toLowerCase();
  if (c.includes("paper")) return ["Size", "Weight", "Color", "Finish"];
  if (c.includes("chair") || c.includes("furniture"))
    return ["Material", "Color", "Dimensions", "Weight Capacity", "Ergonomic Features"];
  if (c.includes("laptop") || c.includes("computer"))
    return ["Processor", "RAM", "Storage", "Display Size", "Operating System"];
  return ["Material", "Color", "Dimensions", "Brand", "Model"];
};

export default function useRFQForm() {
  // navigation
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const goNext = () => setCurrentStep((s) => Math.min(3, s + 1));
  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1));
  const canGoTo = (step) => {
    if (step === 1) return true;
    if (step === 2) return canProceedStep1();
    if (step === 3) return canProceedStep2();
    return false;
  };
  const goTo = (step) => canGoTo(step) && setCurrentStep(step);

  // UI flags
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showVariantMatrix, setShowVariantMatrix] = useState(false);
  const [showSupplierPreview, setShowSupplierPreview] = useState(false);
  const [basicsExpanded, setBasicsExpanded] = useState(true);
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const didAutoExpand = useRef(false);

  // RFQ data
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(BLANK_ITEM);
  const [orderDetails, setOrderDetails] = useState(BLANK_ORDER);
  const [submitted, setSubmitted] = useState(false);
  const [rfqId, setRfqId] = useState(null);

  // actions
  const updateCurrentItem = useCallback((patch) => {
    setCurrentItem((prev) => ({ ...prev, ...patch }));
  }, []);

  const commitCategory = useCallback((label) => {
    setCurrentItem((prev) => ({
      ...prev,
      category: label || "",
      categoryCommitted: !!label,
    }));
  }, []);

  // --- VALIDATORS (define first so guards can reference them) ---
  const isBasicsValid = useCallback(() => {
    // Name now allows 2+ chars (e.g., "A4")
    const nameOk = currentItem.productName.trim().length >= 2;
    const catOk = currentItem.categoryCommitted && currentItem.category.trim().length > 0;
    return nameOk && catOk;
  }, [currentItem.productName, currentItem.category, currentItem.categoryCommitted]);

  // --- GUARDS (depend on validators) ---
  const canSaveItem = useCallback(() => {
    const qty = Number(currentItem.quantity);
    return isBasicsValid() && Number.isFinite(qty) && qty > 0;
  }, [isBasicsValid, currentItem.quantity]);

  const canProceedStep1 = useCallback(() => {
    return items.length > 0 || canSaveItem();
  }, [items.length, canSaveItem]);

  // actions continued
  const addOrUpdateItem = useCallback(() => {
    if (!canSaveItem()) return false;
    const qtyNum = Number(currentItem.quantity);
    const next = {
      ...currentItem,
      id: currentItem.id || uid(),
      quantity: Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 0,
      specCount: Object.entries(currentItem.specifications || {}).filter(
        ([, v]) => String(v || "").trim().length > 0
      ).length,
    };
    setItems((prev) => {
      const i = prev.findIndex((it) => it.id === next.id);
      if (i >= 0) {
        const clone = prev.slice();
        clone[i] = next;
        return clone;
      }
      return [...prev, next];
    });
    setCurrentItem(BLANK_ITEM);
    didAutoExpand.current = false;
    setBasicsExpanded(true);
    setSpecsExpanded(false);
    return true;
  }, [currentItem, canSaveItem]);

  const editItem = useCallback((id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setCurrentItem(it);
    didAutoExpand.current = false;
    setBasicsExpanded(true);
    setSpecsExpanded(false);
    setCurrentStep(1);
  }, [items]);

  const duplicateItem = useCallback((id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const copy = { ...it, id: uid(), productName: `${it.productName} (Copy)` };
    setItems((prev) => [...prev, copy]);
  }, [items]);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const updateOrderDetails = useCallback((patch) => {
    setOrderDetails((prev) => ({ ...prev, ...patch }));
  }, []);

  // auto-expand Specs when basics are valid
  useEffect(() => {
    if (currentStep !== 1) return;
    if (didAutoExpand.current) return;

    const nameOk = currentItem.productName.trim().length >= 2;
    const catOk = !!currentItem.categoryCommitted;

    if (basicsExpanded && nameOk && catOk) {
      didAutoExpand.current = true;
      setBasicsExpanded(false);
      setSpecsExpanded(true);
    }
  }, [
    currentStep,
    basicsExpanded,
    currentItem.productName,
    currentItem.categoryCommitted,
  ]);

  // step 2 guard
  const canProceedStep2 = useCallback(
    () => items.length > 0 && !!(orderDetails?.quoteDeadline),
    [items.length, orderDetails?.quoteDeadline]
  );

  // submit
  const submitRFQ = useCallback(async () => {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const titleVal =
        (orderDetails?.title && orderDetails.title.trim()) ||
        (items?.[0]?.productName || items?.[0]?.name) ||
        "RFQ";

      const rfqInput = { title: titleVal, orderDetails, items };
      const saved = rfqId ? await updateRFQ(rfqId, rfqInput) : await createRFQ(rfqInput);
      setRfqId(saved.id);
      setSubmitted(true);
    } catch (e) {
      console.error("Error submitting RFQ:", e);
      setSubmitError(e?.message || "Failed to submit RFQ");
    } finally {
      setSubmitting(false);
    }
  }, [orderDetails, items, rfqId, submitting]);

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
    updateCurrentItem, commitCategory, addOrUpdateItem, editItem, duplicateItem, removeItem,
    updateOrderDetails,
    // validators & guards
    isBasicsValid, canSaveItem, canProceedStep1, canProceedStep2,
    // submission
    submitRFQ, submitting, submitError,
    // misc
    recommendedFor,
  };
}
// src/components/rfq-form/RequestForm.jsx
import React from "react";
import { ArrowLeft, ShoppingCart, Package } from "lucide-react";

import useRFQForm from "./useRFQForm";
import StepHeader from "./StepHeader";
import BasicsSection from "./BasicsSection";
import SpecsSection from "./SpecsSection";
import MiniCart from "./MiniCart";
import MobileCartSheet from "./MobileCartSheet";
import OrderDetailsForm from "./OrderDetailsForm";
import ReviewPanel from "./ReviewPanel";
import SuccessScreen from "./SuccessScreen";
import VariantMatrixModal from "./VariantMatrixModal";

export default function RequestForm() {
  const {
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
    updateCurrentItem, commitCategory, addOrUpdateItem,
    editItem, duplicateItem, removeItem, updateOrderDetails,

    // validators
    isBasicsValid, canSaveItem, canProceedStep1, canProceedStep2,

    // submission
    //submitRFQ,
    submitRFQ, submitting, submitError,

    // misc
    recommendedFor,
  } = useRFQForm();

  const onPrimary = async () => {
    if (currentStep === 1) {
      if (canSaveItem()) {
        const ok = addOrUpdateItem();
        if (!ok) return;
      }
      goNext();
      return;
    }
    if (currentStep === 2) { goNext(); return; }
    if (currentStep === 3) { await submitRFQ(); }
  };

  const primaryLabel =
    currentStep === 3
      ? "Confirm & Submit"
      : currentStep === 1 && items.length === 0 && canSaveItem()
      ? "Save & Continue"
      : "Continue";

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 py-8">
          <SuccessScreen rfqId={rfqId} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                className="mr-3 p-1 hover:bg-gray-100 rounded"
                onClick={goBack}
                disabled={currentStep === 1}
                title={currentStep === 1 ? "" : "Back"}
              >
                <ArrowLeft className={`h-6 w-6 ${currentStep === 1 ? "text-gray-300" : "text-gray-600"}`} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Request for Quotation</h1>
            </div>

            <button
              className="md:hidden flex items-center p-2 border border-gray-300 rounded-lg"
              onClick={() => setShowMobileCart(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="text-sm">{items.length}</span>
            </button>
          </div>

          <StepHeader currentStep={currentStep} canGoTo={canGoTo} goTo={goTo} />
        </div>
      </header>

      {/* Main */}
      <div className="flex pb-24">
        <main className="flex-1 px-6 py-8">
          {currentStep === 1 && (
            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Product Details</h2>
                  <p className="text-gray-600">Add product basics, then specify details and quantity.</p>
                </div>

                {/* A: Basics */}
                <BasicsSection
                  currentItem={currentItem}
                  updateCurrentItem={updateCurrentItem}
                  commitCategory={commitCategory}
                  basicsExpanded={basicsExpanded}
                  setBasicsExpanded={setBasicsExpanded}
                  isBasicsValid={isBasicsValid}
                />

                {/* B: Specs & Quantity */}
                <SpecsSection
                  currentItem={currentItem}
                  updateCurrentItem={updateCurrentItem}
                  specsExpanded={specsExpanded}
                  setSpecsExpanded={setSpecsExpanded}
                  recommended={recommendedFor(currentItem?.category)}
                  canSaveItem={canSaveItem}
                  onSaveItem={addOrUpdateItem}
                  onOpenVariantMatrix={() => setShowVariantMatrix(true)}
                />
              </div>

              {/* Right (desktop) */}
              <aside className="w-80 hidden lg:block">
                <div className="sticky top-24">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Items ({items.length})
                      </h3>
                    </div>
                    <MiniCart
                      items={items}
                      onEdit={(id) => { editItem(id); }}
                      onDuplicate={duplicateItem}
                      onRemove={removeItem}
                    />
                  </div>
                </div>
              </aside>
            </div>
          )}

          {currentStep === 2 && (
            <OrderDetailsForm
              orderDetails={orderDetails}
              updateOrderDetails={updateOrderDetails}
            />
          )}

          {currentStep === 3 && (
            <ReviewPanel
              items={items}
              orderDetails={orderDetails}
              onEditItem={(id) => { editItem(id); goTo(1); }}
              showSupplierPreview={showSupplierPreview}
              setShowSupplierPreview={setShowSupplierPreview}
            />
          )}
        </main>

        {/* Sidebar (steps 2 & 3) */}
        {currentStep > 1 && (
          <aside className="hidden md:block w-80 p-6">
            <div className="sticky top-24">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Items ({items.length})
                  </h3>
                </div>
                <MiniCart
                  items={items}
                  onEdit={(id) => { editItem(id); goTo(1); }}
                  onDuplicate={duplicateItem}
                  onRemove={removeItem}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile cart */}
      <MobileCartSheet open={showMobileCart} onClose={() => setShowMobileCart(false)}>
        <MiniCart
          items={items}
          onEdit={(id) => { editItem(id); goTo(1); setShowMobileCart(false); }}
          onDuplicate={duplicateItem}
          onRemove={removeItem}
        />
      </MobileCartSheet>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:px-6">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          <button
            onClick={goBack}
            disabled={currentStep === 1}
            className={`px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors ${
              currentStep === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Back
          </button>
          <div className="flex space-x-3">
            {currentStep === 1 && (
              <button
                onClick={addOrUpdateItem}
                disabled={!canSaveItem()}
                className={`px-6 py-3 border-2 rounded-lg font-medium transition-colors ${
                  canSaveItem()
                    ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                    : "border-gray-300 text-gray-400 cursor-not-allowed"
                }`}
                title={!canSaveItem() ? "Add name, select category, and quantity" : ""}
              >
                Save & Add Another
              </button>
            )}
            <button
              onClick={onPrimary}
              disabled={
                submitting ||
                (currentStep === 1 && !canProceedStep1()) ||
                (currentStep === 2 && !canProceedStep2())
              }
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                (currentStep === 1 && canProceedStep1()) ||
                (currentStep === 2 && canProceedStep2()) ||
                currentStep === 3
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting ? "Submitting…" : primaryLabel}
            </button>
          </div>
          {/* Show submission errors (e.g., not signed in, RLS, schema) */}
          {submitError && (
            <p className="mt-3 text-sm text-red-600">
              {submitError}
            </p>
          )}
        </div>
      </div>

      <VariantMatrixModal
        open={showVariantMatrix}
        onClose={() => setShowVariantMatrix(false)}
        onCreate={() => setShowVariantMatrix(false)}
      />
    </div>
  );
}

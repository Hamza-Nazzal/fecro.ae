// src/components/QuotationViewer.jsx
//src/components/QuotationViewer.jsx
import React from "react";
import { X, Calendar, Package, Truck, FileText, Check } from "lucide-react";
import {
  expressInterestInQuotation,
  fetchBuyerInterestForQuotation,
  fetchSellerInterestForQuotation,
  updateQuotationInterestStatus,
} from "../services/quotationsService";
import { supabase } from "../services/backends/supabase";

export default function QuotationViewer({ quotation, onClose, userRole }) {
  // Buyer interest state (only used when userRole === "buyer")
  const [interest, setInterest] = React.useState(null);
  // interest shape: { status: "pending" | "approved" | "rejected" | ..., ... }
  const [interestLoading, setInterestLoading] = React.useState(false);
  const [interestError, setInterestError] = React.useState("");

  // Seller interest state (only used when userRole === "seller")
  const [sellerInterest, setSellerInterest] = React.useState(null);
  const [sellerInterestLoading, setSellerInterestLoading] = React.useState(false);
  const [sellerInterestError, setSellerInterestError] = React.useState("");

  // Contact details state
  const [sellerContact, setSellerContact] = React.useState(null);
  const [buyerContact, setBuyerContact] = React.useState(null);
  const [contactLoading, setContactLoading] = React.useState(false);

  // Load current interest when viewer opens (buyer only)
  React.useEffect(() => {
    if (userRole !== "buyer") return;
    if (!quotation?.id) return;

    const rfqId = quotation?.rfqId || quotation?.rfq?.id || quotation?.rfq_id || null;

    setInterestLoading(true);
    setInterestError("");

    fetchBuyerInterestForQuotation({
      rfqId,
      quotationId: quotation.id,
    })
      .then((result) => {
        setInterest(result || null);
      })
      .catch((e) => {
        setInterestError(e.message || "Failed to load interest state");
      })
      .finally(() => {
        setInterestLoading(false);
      });
  }, [userRole, quotation?.id, quotation?.rfqId, quotation?.rfq?.id, quotation?.rfq_id]);

  // Load seller interest when viewer opens (seller only)
  React.useEffect(() => {
    if (userRole !== "seller") return;
    if (!quotation?.id) return;

    setSellerInterestLoading(true);
    setSellerInterestError("");

    fetchSellerInterestForQuotation({
      quotationId: quotation.id,
    })
      .then((result) => {
        setSellerInterest(result || null);
      })
      .catch((e) => {
        setSellerInterestError(e.message || "Failed to load buyer interest");
      })
      .finally(() => {
        setSellerInterestLoading(false);
      });
  }, [userRole, quotation?.id]);

  // Load contact details when contacts are unlocked
  React.useEffect(() => {
    if (!quotation?.id) return;

    const isContactsUnlocked = quotation.contactsUnlocked === true;

    // Buyer view: fetch seller contact when unlocked
    if (userRole === "buyer" && isContactsUnlocked && interest?.status === "approved") {
      setContactLoading(true);
      supabase
        .rpc('quotation_get_contact', { p_quotation_id: quotation.id })
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to fetch seller contact:", error);
            setSellerContact(null);
          } else {
            setSellerContact(data);
          }
        })
        .catch((e) => {
          console.error("Failed to fetch seller contact:", e);
          setSellerContact(null);
        })
        .finally(() => {
          setContactLoading(false);
        });
    }

    // Seller view: fetch buyer contact when unlocked
    if (userRole === "seller" && isContactsUnlocked && sellerInterest?.status === "approved") {
      setContactLoading(true);
      supabase
        .rpc('quotation_get_contact', { p_quotation_id: quotation.id })
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to fetch buyer contact:", error);
            setBuyerContact(null);
          } else {
            setBuyerContact(data);
          }
        })
        .catch((e) => {
          console.error("Failed to fetch buyer contact:", e);
          setBuyerContact(null);
        })
        .finally(() => {
          setContactLoading(false);
        });
    }
  }, [userRole, quotation?.id, quotation?.contactsUnlocked, interest?.status, sellerInterest?.status]);

  const formatCurrency = (amount, currency = "AED") => {
    const numAmount = Number(amount) || 0;
    return `${currency} ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAccepted = (quotation?.status || "").toLowerCase() === "accepted";

  // Extract contact from array if needed
  const sellerC = Array.isArray(sellerContact) ? sellerContact[0] : sellerContact;
  const buyerC = Array.isArray(buyerContact) ? buyerContact[0] : buyerContact;

  // Helper to check if there's any contact info
  const hasSellerContactInfo = (contact) => {
    if (!contact) return false;
    return !!(
      contact.company_name ||
      contact.company_phone ||
      contact.city ||
      contact.country
    );
  };

  const hasBuyerContactInfo = (contact) => {
    if (!contact) return false;
    return !!(
      contact.company_name ||
      contact.company_phone ||
      contact.city ||
      contact.country
    );
  };

  const sellerHasInfo = sellerC && hasSellerContactInfo(sellerC);
  const buyerHasInfo = buyerC && hasBuyerContactInfo(buyerC);

  if (!quotation) {
    return null;
  }

  // Handler for expressing interest
  async function handleExpressInterest() {
    if (userRole !== "buyer" || !quotation?.id) return;

    setInterestLoading(true);
    setInterestError("");

    try {
      const rfqId = quotation?.rfqId || quotation?.rfq?.id || quotation?.rfq_id || null;

      const interestRow = await expressInterestInQuotation({
        rfqId,
        quotationId: quotation.id,
      });

      // After expressing interest, normalize into our local shape
      if (interestRow) {
        setInterest({
          id: interestRow.id,
          status: interestRow.status,
          rfqId: interestRow.rfq_id || rfqId || null,
          quotationId: interestRow.quotation_id || quotation.id,
          createdAt: interestRow.created_at,
          updatedAt: interestRow.updated_at,
        });
        // Dispatch event to notify other components of the interest update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("quotationInterest:updated", { 
            detail: { rfqId, quotationId: quotation.id } 
          }));
        }
      }
    } catch (e) {
      setInterestError(e.message || "Failed to express interest");
    } finally {
      setInterestLoading(false);
    }
  }

  // Handler for seller to approve interest
  async function handleApproveInterest() {
    if (!sellerInterest?.id) return;

    setSellerInterestLoading(true);
    setSellerInterestError("");

    try {
      const updated = await updateQuotationInterestStatus({
        id: sellerInterest.id,
        status: "approved",
        resolutionNote: null,
      });

      setSellerInterest(updated);
      // Dispatch event to notify other components of the interest update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("quotationInterest:updated"));
      }
    } catch (e) {
      setSellerInterestError(e.message || "Failed to approve interest");
    } finally {
      setSellerInterestLoading(false);
    }
  }

  // Handler for seller to reject interest
  async function handleRejectInterest() {
    if (!sellerInterest?.id) return;

    setSellerInterestLoading(true);
    setSellerInterestError("");

    try {
      const updated = await updateQuotationInterestStatus({
        id: sellerInterest.id,
        status: "rejected",
        resolutionNote: null,
      });

      setSellerInterest(updated);
      // Dispatch event to notify other components of the interest update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("quotationInterest:updated"));
      }
    } catch (e) {
      setSellerInterestError(e.message || "Failed to reject interest");
    } finally {
      setSellerInterestLoading(false);
    }
  }

  const statusStyles = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-orange-100 text-orange-800",
    expired: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quotation Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {quotation.rfq?.sellerRfqId || "—"}
            </p>
            {userRole === "seller" && quotation?.sellerQuoteRef && (
              <p className="text-[11px] text-slate-500 mt-1">
                Ref: {quotation.sellerQuoteRef}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusStyles[quotation.status] || statusStyles.draft
                }`}
              >
                {quotation.status
                  ? quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)
                  : "Draft"}
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(quotation.totalPrice, quotation.currency)}
              </div>
              <div className="text-sm text-gray-500">Total Price</div>
            </div>
          </div>

          {/* Buyer Interest Block */}
          {userRole === "buyer" && (
            <div className="border-t pt-4">
              {interestLoading ? (
                <div className="text-xs text-gray-500">Checking interest…</div>
              ) : interestError ? (
                <div className="text-xs text-red-600">{interestError}</div>
              ) : interest?.status === "pending" ? (
                <div className="text-xs text-gray-600">
                  You've requested to unlock this seller's contact details. Waiting for seller approval.
                </div>
              ) : interest?.status === "approved" ? (
                <div className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Contacts unlocked
                </div>
              ) : interest?.status === "rejected" ? (
                <div className="text-xs text-gray-600">
                  This seller declined to share contact details for this quotation.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleExpressInterest}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-slate-50"
                >
                  I'm interested in this quotation
                </button>
              )}
            </div>
          )}

          {/* Seller Interest Block */}
          {userRole === "seller" && (
            <div className="border-t pt-4">
              {sellerInterestLoading ? (
                <div className="text-xs text-gray-500">Checking buyer interest…</div>
              ) : sellerInterestError ? (
                <div className="text-xs text-red-600">{sellerInterestError}</div>
              ) : !sellerInterest ? (
                <div className="text-xs text-gray-500">
                  No buyer interest requests yet for this quotation.
                </div>
              ) : sellerInterest.status === "pending" ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    A buyer is interested in this quotation and requested to unlock contact details.
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleApproveInterest}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 mr-2"
                    >
                      Approve & unlock
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectInterest}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : sellerInterest.status === "approved" ? (
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800">
                    <Check className="w-3 h-3 mr-1" />
                    {isAccepted ? "Accepted · Contact buyer" : "Contact buyer"}
                  </span>
                </div>
              ) : sellerInterest.status === "rejected" ? (
                <div className="text-xs text-gray-600">
                  You declined this buyer's interest request.
                </div>
              ) : null}
            </div>
          )}

          {/* RFQ Details */}
          {quotation.rfq && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Request Details</h3>
              <div className="text-sm text-gray-600">
                <div><strong>Title:</strong> {quotation.rfq.title}</div>
                <div><strong>Company:</strong> {quotation.rfq.company}</div>
                <div><strong>Status:</strong> {quotation.rfq.status}</div>
              </div>
            </div>
          )}

          {/* Line Items */}
          {quotation.lineItems && quotation.lineItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Package size={18} className="mr-2" />
                Line Items
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotation.lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.item}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(item.unitPrice, quotation.currency)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(Number(item.total || item.quantity * item.unitPrice), quotation.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Terms and Timeline */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Truck size={18} className="mr-2" />
                Delivery & Terms
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Delivery Timeline:</span>
                  <span className="ml-2 font-medium">
                    {quotation.deliveryTimelineDays ? `${quotation.deliveryTimelineDays} days` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Terms:</span>
                  <span className="ml-2 font-medium">{quotation.paymentTerms || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Shipping Terms:</span>
                  <span className="ml-2 font-medium">{quotation.shippingTerms || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Valid For:</span>
                  <span className="ml-2 font-medium">
                    {quotation.validityDays ? `${quotation.validityDays} days` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar size={18} className="mr-2" />
                Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(quotation.createdAt)}</span>
                </div>
                {quotation.submittedAt && (
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 font-medium">{formatDate(quotation.submittedAt)}</span>
                  </div>
                )}
                {quotation.expiresAt && (
                  <div>
                    <span className="text-gray-600">Expires:</span>
                    <span className="ml-2 font-medium">{formatDate(quotation.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText size={18} className="mr-2" />
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            </div>
          )}

          {/* Seller Contact Panel (Buyer View) */}
          {userRole === "buyer" &&
            interest?.status === "approved" &&
            quotation.contactsUnlocked === true &&
            sellerHasInfo && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Seller Contact</h3>
                <div className="space-y-2 text-sm">
                  {sellerC.company_name && (
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <span className="ml-2 font-medium text-gray-800">{sellerC.company_name}</span>
                    </div>
                  )}
                  {sellerC.company_phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium text-gray-800">{sellerC.company_phone}</span>
                    </div>
                  )}
                  {sellerC.city && (
                    <div>
                      <span className="text-gray-600">City:</span>
                      <span className="ml-2 font-medium text-gray-800">{sellerC.city}</span>
                    </div>
                  )}
                  {sellerC.country && (
                    <div>
                      <span className="text-gray-600">Country:</span>
                      <span className="ml-2 font-medium text-gray-800">{sellerC.country}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Buyer Contact Panel (Seller View) */}
          {userRole === "seller" &&
            sellerInterest?.status === "approved" &&
            quotation.contactsUnlocked === true &&
            buyerHasInfo && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Buyer Contact</h3>
                <div className="space-y-2 text-sm">
                  {buyerC.company_name && (
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <span className="ml-2 font-medium text-gray-800">{buyerC.company_name}</span>
                    </div>
                  )}
                  {buyerC.company_phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium text-gray-800">{buyerC.company_phone}</span>
                    </div>
                  )}
                  {buyerC.city && (
                    <div>
                      <span className="text-gray-600">City:</span>
                      <span className="ml-2 font-medium text-gray-800">{buyerC.city}</span>
                    </div>
                  )}
                  {buyerC.country && (
                    <div>
                      <span className="text-gray-600">Country:</span>
                      <span className="ml-2 font-medium text-gray-800">{buyerC.country}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

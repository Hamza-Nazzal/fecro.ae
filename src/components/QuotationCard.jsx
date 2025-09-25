// src/components/QuotationCard.jsx
//src/components/QuotationCard.jsx
import { useState } from 'react';
import { Check, X, Eye, Edit, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { 
  QUOTATION_STATUS_LABELS, 
  QUOTATION_STATUS_COLORS,
  formatCurrency,
  getQuotationExpiryStatus,
  canEditQuotation,
  canSubmitQuotation,
  canWithdrawQuotation,
  canAcceptQuotation,
  canRejectQuotation
} from '../services/quotationHelpers.js';

export default function QuotationCard({ 
  quotation, 
  rfq, 
  currentUserId, 
  userRole, // 'buyer' | 'seller'
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onAccept,
  onReject,
  onWithdraw,
  className = ''
}) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  if (!quotation) return null;

  const rfqData = rfq || quotation.rfq;
  const statusLabel = QUOTATION_STATUS_LABELS[quotation.status] || quotation.status;
  const statusColor = QUOTATION_STATUS_COLORS[quotation.status] || 'gray';
  const expiryStatus = getQuotationExpiryStatus(quotation);

  // Permissions
  const permissions = {
    canEdit: canEditQuotation(quotation, currentUserId),
    canSubmit: canSubmitQuotation(quotation, currentUserId),
    canWithdraw: canWithdrawQuotation(quotation, currentUserId),
    canAccept: canAcceptQuotation(quotation, rfqData, currentUserId),
    canReject: canRejectQuotation(quotation, rfqData, currentUserId),
  };

  const handleAction = (actionFn, ...args) => {
    setIsActionsOpen(false);
    if (actionFn) actionFn(...args);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(statusColor)}`}>
              {statusLabel}
            </span>
            {expiryStatus?.status === 'expiring_soon' && (
              <span className="flex items-center gap-1 text-amber-600 text-xs">
                <AlertTriangle className="w-3 h-3" />
                {expiryStatus.message}
              </span>
            )}
          </div>
          
          {rfqData && (
            <p className="text-sm text-gray-600">
              for <span className="font-medium">{rfqData.sellerIdDisplay || rfqData.title}</span>
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Quotation actions"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path d="M10 4a2 2 0 100-4 2 2 0 000 4z"/>
              <path d="M10 20a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
          </button>

          {isActionsOpen && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => handleAction(onView, quotation.id)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" /> View Details
              </button>

              {permissions.canEdit && (
                <button
                  onClick={() => handleAction(onEdit, quotation.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              )}

              {permissions.canSubmit && (
                <button
                  onClick={() => handleAction(onSubmit, quotation.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
                >
                  <Check className="w-4 h-4" /> Submit
                </button>
              )}

              {permissions.canWithdraw && (
                <button
                  onClick={() => handleAction(onWithdraw, quotation.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                >
                  <X className="w-4 h-4" /> Withdraw
                </button>
              )}

              {permissions.canAccept && (
                <button
                  onClick={() => handleAction(onAccept, quotation.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
              )}

              {permissions.canReject && (
                <button
                  onClick={() => handleAction(onReject, quotation.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              )}

              {permissions.canEdit && (
                <>
                  <hr className="my-1" />
                  <button
                    onClick={() => handleAction(onDelete, quotation.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(quotation.totalPrice, quotation.currency)}
        </div>
        {quotation.lineItems?.length > 0 && (
          <div className="text-sm text-gray-500">
            {quotation.lineItems.length} line item{quotation.lineItems.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        {quotation.deliveryTimelineDays && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{quotation.deliveryTimelineDays} days delivery</span>
          </div>
        )}

        {quotation.paymentTerms && (
          <div className="text-gray-600">
            Payment: <span className="font-medium">{quotation.paymentTerms}</span>
          </div>
        )}

        {quotation.notes && (
          <div className="text-gray-600">
            <div className="font-medium">Notes:</div>
            <div className="text-gray-500 line-clamp-2">{quotation.notes}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <span>
          {quotation.submittedAt ? 
            `Submitted ${formatRelativeTime(quotation.submittedAt)}` :
            `Created ${formatRelativeTime(quotation.createdAt)}`
          }
        </span>
        
        {expiryStatus && quotation.status === 'submitted' && (
          <span className={getExpiryColorClass(expiryStatus.status)}>
            {expiryStatus.message}
          </span>
        )}
      </div>

      {/* Click outside handler */}
      {isActionsOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsActionsOpen(false)} />
      )}
    </div>
  );
}

// Helper functions
function getStatusClasses(color) {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800'
  };
  return colorMap[color] || colorMap.gray;
}

function getExpiryColorClass(status) {
  const statusMap = {
    expired: 'text-red-600',
    expiring_soon: 'text-amber-600',
    expiring_this_week: 'text-yellow-600',
    active: 'text-gray-500'
  };
  return statusMap[status] || statusMap.active;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) return date.toLocaleDateString();
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

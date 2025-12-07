// src/components/QuotationCard.jsx
//src/components/QuotationCard.jsx
import { Check, X, Eye, Clock, AlertTriangle } from 'lucide-react';
import { 
  QUOTATION_STATUS_LABELS, 
  QUOTATION_STATUS_COLORS,
  formatCurrency,
  getQuotationExpiryStatus
} from '../services/quotationHelpers.js';

export default function QuotationCard({ 
  quotation, 
  rfq, 
  currentUserId, 
  userRole, // 'buyer' | 'seller'
  hasPendingInterest = false, // seller view only: whether this quotation has pending buyer interest
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onAccept,
  onReject,
  onWithdraw,
  className = ''
}) {
  if (!quotation) return null;

  const sellerQuoteRef = quotation?.sellerQuoteRef;
  const rfqData = rfq || quotation.rfq;
  const statusLabel = QUOTATION_STATUS_LABELS[quotation.status] || quotation.status;
  const statusColor = QUOTATION_STATUS_COLORS[quotation.status] || 'gray';
  const expiryStatus = getQuotationExpiryStatus(quotation);
  const isAccepted = (quotation.status || "").toLowerCase() === "accepted";

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(statusColor)}`}>
            {statusLabel}
          </span>
          {expiryStatus?.status === 'expiring_soon' && (
            <span className="flex items-center gap-1 text-amber-600 text-xs">
              <AlertTriangle className="w-3 h-3" />
              {expiryStatus.message}
            </span>
          )}
          {userRole === "seller" && hasPendingInterest && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600">
              Buyer interested
            </span>
          )}
          {userRole === "seller" && quotation.contactsUnlocked === true && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
              <Check className="w-3 h-3 mr-1" />
              {isAccepted ? "Accepted · Contact buyer" : "Contact buyer"}
            </span>
          )}
        </div>
        
        {rfqData && (
          <p className="text-sm text-gray-600">
            for <span className="font-medium">{rfqData.sellerRfqId || rfqData.title}</span>
          </p>
        )}
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
        {userRole === "seller" && sellerQuoteRef && (
          <div className="text-[11px] text-slate-500 mt-1">
            Ref: {sellerQuoteRef}
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

      {/* View Button for Seller */}
      {userRole === "seller" && (
        <div className="mt-3">
          <button
            onClick={() => onView?.(quotation.id)}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View my quotation
          </button>
        </div>
      )}

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

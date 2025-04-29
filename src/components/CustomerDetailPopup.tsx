import { Calendar } from 'lucide-react';
import { SpreadsheetRow } from '@/types';

interface CustomerDetailPopupProps {
  customer: SpreadsheetRow;
  onClose: () => void;
}

export function CustomerDetailPopup({ customer, onClose }: CustomerDetailPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Customer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Company Information</h3>
            <p className="text-gray-900">{customer.customer}</p>
            <p className="text-sm text-gray-600">{customer.company}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Contact Information</h3>
            <p className="text-gray-900">{customer.contactNumber}</p>
            <p className="text-gray-900">{customer.emailAddress}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Business Details</h3>
            <p className="text-gray-900">UEN: {customer.uen}</p>
            <p className="text-gray-900">Type: {customer.type}</p>
            {customer.existing_subs_from_chargebee === 'yes' && (
              <p className="text-gray-900">CB Subs ID: {customer.x_studio_cb_subscription_id || 'N/A'}</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Follow-up Information</h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {customer.lastFollowUpDate ? new Date(customer.lastFollowUpDate).toLocaleString('en-SG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }) : 'No follow-up yet'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Follow-up Count: {customer.followUpCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
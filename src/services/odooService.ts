import { SpreadsheetRow } from '@/types';
import { getPaymentStatus } from './stripeService';

// Cache for payment status to avoid redundant Stripe API calls
const paymentStatusCache = new Map<string, string>();

export const fetchOdooData = async (month: string): Promise<SpreadsheetRow[]> => {
  try {
    console.log('Fetching Odoo data for month:', month);
    // Fetch Odoo data through our proxy
    const response = await fetch(`/api/odoo?month=${month}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Odoo API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch Odoo data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Odoo data fetched successfully:', data.length, 'records');

    // Debug logging for S00509
    const s00509 = data.find((order: any) => order.name === 'S00509');
    if (s00509) {
      console.log('S00509 raw data:', {
        x_studio_cb_subscription_id: s00509.x_studio_cb_subscription_id,
        x_studio_existing_subs_from_chargebee: s00509.x_studio_existing_subs_from_chargebee
      });
    }

    const results = await Promise.all(data.map(async (order: any) => {
      // Use the payment_status from the backend
      const paymentStatus = order.payment_status || '';

      return {
        id: order.id?.toString() || crypto.randomUUID(),
        so: order.name || order.so,
        date: order.date_order,
        customer: order.partner_id?.[1] || '',
        amount: order.amount_total,
        status: order.state,
        uen: order.uen || 'N/A',
        existingSubs: order.x_studio_existing_subs_from_chargebee || '',
        company: order.company_id?.[1] || '',
        creationDate: order.date_order ? new Date(order.date_order) : null,
        contactNumber: order.phone || '',
        emailAddress: order.email || '',
        rpaNfye: '',
        type: order.x_studio_existing_subs_from_chargebee === 'Yes' ? 'Renewal' : 'New Lead',
        priority: order.amount_total >= 3000 ? 'High' : 
                 order.amount_total >= 1000 ? 'Medium' : 'Low',
        paymentStatus: paymentStatus,
        pic: order.user_id?.[1] || '',
        followUpChannels: order.followUpChannels || [],
        followUpNotes: order.followUpNotes || '',
        followUpCount: order.followUpCount || 0,
        lastFollowUpDate: order.lastFollowUpDate ? new Date(order.lastFollowUpDate) : new Date(),
        partner_id: order.partner_id || null,
        create_date: order.create_date || null,
        existing_subs_from_chargebee: order.x_studio_existing_subs_from_chargebee || null,
        x_studio_cb_subscription_id: order.x_studio_cb_subscription_id || ''
      };
    }));

    console.log('Data processing completed successfully');
    return results;
  } catch (error) {
    console.error('Error in fetchOdooData:', error);
    throw error;
  }
}; 
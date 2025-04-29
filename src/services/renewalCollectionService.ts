import * as xmlrpc from 'xmlrpc';

interface Payment {
  id: number;
  amount: number;
  date: string;
  x_studio_related_field_2p3_1iptocq6m: any;
  x_studio_payment_state_1: string;
}

interface SalesOrder {
  id: number;
  amount_total: number;
  date_order: string;
  x_studio_existing_subs_from_chargebee: string;
  name: string;
}

const RENEWAL_COLLECTION_URL = process.env.ODOO_URL || '';
const RENEWAL_COLLECTION_DB = process.env.ODOO_DB || '';
const RENEWAL_COLLECTION_USERNAME = process.env.ODOO_USERNAME || '';
const RENEWAL_COLLECTION_PASSWORD = process.env.ODOO_PASSWORD || '';

let commonClient: xmlrpc.Client | null = null;
let objectClient: xmlrpc.Client | null = null;
let renewalCollectionUid: number | null = null;

const getCommonClient = async () => {
  if (!commonClient) {
    commonClient = xmlrpc.createClient(RENEWAL_COLLECTION_URL + '/xmlrpc/2/common');
  }
  return commonClient;
};

const getObjectClient = async () => {
  if (!objectClient) {
    objectClient = xmlrpc.createClient(RENEWAL_COLLECTION_URL + '/xmlrpc/2/object');
  }
  return objectClient;
};

const getRenewalCollectionUid = async () => {
  if (!renewalCollectionUid) {
    const client = await getCommonClient();
    if (!client) throw new Error('Failed to create XML-RPC client');
    
    renewalCollectionUid = await new Promise<number>((resolve, reject) => {
      client.methodCall('authenticate', [
        RENEWAL_COLLECTION_DB,
        RENEWAL_COLLECTION_USERNAME,
        RENEWAL_COLLECTION_PASSWORD,
        {},
      ], (err, result) => {
        if (err) reject(err);
        else resolve(Number(result));
      });
    });
  }
  return renewalCollectionUid;
};

// Helper function to extract numeric ID from SO number
const extractNumericId = (soNumber: any): number => {
  if (!soNumber) return 0;
  
  // Convert to string if it's not already
  const soNumberStr = String(soNumber);
  const match = soNumberStr.match(/S(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export const fetchRenewalCollectionData = async () => {
  try {
    const objectClient = await getObjectClient();
    if (!objectClient) throw new Error('Failed to create XML-RPC client');
    const uid = await getRenewalCollectionUid();

    // Get the last 4 weeks dates (excluding current week)
    const now = new Date();
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(now);
      // Start from last week and go back 3 more weeks
      start.setDate(start.getDate() - ((i + 1) * 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    });

    // Set the beginning date to February 28th
    const beginningDate = new Date('2024-02-28');

    // Fetch all sales orders from beginning to end of last week
    const salesOrdersResponse = await new Promise<any>((resolve, reject) => {
      objectClient.methodCall('execute_kw', [
        RENEWAL_COLLECTION_DB,
        uid,
        RENEWAL_COLLECTION_PASSWORD,
        'sale.order',
        'search_read',
        [
          [
            ['date_order', '>=', beginningDate.toISOString().split('T')[0]],
            ['date_order', '<=', weeks[0].end.toISOString().split('T')[0]],
          ],
          [
            'id',
            'amount_total',
            'date_order',
            'x_studio_existing_subs_from_chargebee',
            'name',
          ],
        ],
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const salesOrders = salesOrdersResponse as unknown as SalesOrder[];

    // First, let's check all payments without filtering to see what states exist
    const allPaymentsResponse = await new Promise<any>((resolve, reject) => {
      objectClient.methodCall('execute_kw', [
        RENEWAL_COLLECTION_DB,
        uid,
        RENEWAL_COLLECTION_PASSWORD,
        'account.payment',
        'search_read',
        [
          [
            ['state', '!=', 'draft'],
            ['date', '>=', beginningDate.toISOString().split('T')[0]],
            ['date', '<=', weeks[0].end.toISOString().split('T')[0]],
          ],
          [
            'id',
            'amount',
            'date',
            'x_studio_related_field_2p3_1iptocq6m',
            'x_studio_payment_state_1',
          ],
        ],
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const allPayments = allPaymentsResponse as unknown as Payment[];
    console.log('All Payment States:', Array.from(new Set(allPayments.map(p => p.x_studio_payment_state_1))));

    // Fetch payments for each sales order
    const paymentsResponse = await new Promise<any>((resolve, reject) => {
      objectClient.methodCall('execute_kw', [
        RENEWAL_COLLECTION_DB,
        uid,
        RENEWAL_COLLECTION_PASSWORD,
        'account.payment',
        'search_read',
        [
          [
            ['x_studio_related_field_2p3_1iptocq6m', 'in', salesOrders.map(so => so.id)],
          ],
          [
            'id',
            'amount',
            'date',
            'x_studio_related_field_2p3_1iptocq6m',
            'x_studio_payment_state_1',
          ],
        ],
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const payments = paymentsResponse as unknown as Payment[];

    // Fetch subscription data for each sales order
    const subscriptionResponse = await new Promise<any>((resolve, reject) => {
      objectClient.methodCall('execute_kw', [
        RENEWAL_COLLECTION_DB,
        uid,
        RENEWAL_COLLECTION_PASSWORD,
        'sale.subscription',
        'search_read',
        [
          [
            ['sale_order', 'in', salesOrders.map(so => so.id)],
          ],
          [
            'id',
            'sale_order',
            'recurring_next_date',
            'recurring_total',
          ],
        ],
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Debug: Log payments
    console.log('Filtered Payments:', payments.map(p => ({
      id: p.id,
      amount: p.amount,
      date: p.date,
      soNumber: p.x_studio_related_field_2p3_1iptocq6m,
      paymentState: p.x_studio_payment_state_1
    })));

    // Create a map of SO ID to type
    const soTypeMap = new Map(salesOrders.map(so => [
      so.id,
      so.x_studio_existing_subs_from_chargebee === 'Yes' ? 'Renewal' : 'New Lead'
    ]));

    // Create a map of SO ID to total paid amount
    const soPaidMap = new Map<number, number>();
    payments.forEach(payment => {
      const numericId = extractNumericId(payment.x_studio_related_field_2p3_1iptocq6m);
      if (numericId > 0) {
        const currentPaid = soPaidMap.get(numericId) || 0;
        soPaidMap.set(numericId, currentPaid + payment.amount);
      }
    });

    // Debug: Log sales orders and their payments
    salesOrders.forEach(so => {
      const paidAmount = soPaidMap.get(so.id) || 0;
      console.log('Sales Order:', {
        id: so.id,
        name: so.name,
        totalAmount: so.amount_total,
        paidAmount,
        unpaidAmount: so.amount_total - paidAmount,
        type: soTypeMap.get(so.id)
      });
    });

    // Initialize result arrays
    const result = {
      totalPaid: Array(4).fill(0),
      totalUnpaid: Array(4).fill(0),
      renewalPaid: Array(4).fill(0),
      renewalUnpaid: Array(4).fill(0),
      newLeadPaid: Array(4).fill(0),
      newLeadUnpaid: Array(4).fill(0),
    };

    // Calculate totals for each week from beginning up to that week
    weeks.forEach((week, weekIndex) => {
      // Process all sales orders up to this week
      salesOrders.forEach(so => {
        const orderDate = new Date(so.date_order);
        // Only include orders up to the end of this week
        if (orderDate > week.end) return;

        const totalAmount = so.amount_total;
        const paidAmount = soPaidMap.get(so.id) || 0;
        // Only count unpaid amount if the order is not fully paid
        const unpaidAmount = paidAmount < totalAmount ? totalAmount - paidAmount : 0;
        const soType = soTypeMap.get(so.id);

        // Update totals for this week
        result.totalPaid[weekIndex] += paidAmount;
        result.totalUnpaid[weekIndex] += unpaidAmount;
        
        if (soType === 'Renewal') {
          result.renewalPaid[weekIndex] += paidAmount;
          result.renewalUnpaid[weekIndex] += unpaidAmount;
        } else if (soType === 'New Lead') {
          result.newLeadPaid[weekIndex] += paidAmount;
          result.newLeadUnpaid[weekIndex] += unpaidAmount;
        }
      });

      // Debug: Log weekly totals
      console.log(`Week ${weekIndex} totals:`, {
        start: week.start.toISOString().split('T')[0],
        end: week.end.toISOString().split('T')[0],
        totalPaid: result.totalPaid[weekIndex],
        totalUnpaid: result.totalUnpaid[weekIndex],
        renewalPaid: result.renewalPaid[weekIndex],
        renewalUnpaid: result.renewalUnpaid[weekIndex],
        newLeadPaid: result.newLeadPaid[weekIndex],
        newLeadUnpaid: result.newLeadUnpaid[weekIndex],
      });
    });

    return {
      data: result,
      weeks: weeks.map(week => ({
        end: week.end.toISOString().split('T')[0],
      })),
    };
  } catch (error) {
    console.error('Error fetching renewal collection data:', error);
    throw error;
  }
}; 
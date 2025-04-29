import { connectToOdoo, getSaleOrders, checkPaymentStatus } from '../app/api/odoo/route';

interface SaleOrder {
  so: string;
  x_studio_related_field_9ma_1ipqq874u?: string;
  [key: string]: any;
}

async function testPaymentStatus() {
  try {
    console.log('Starting test for SO S00219...');
    
    // Connect to Odoo
    const uid = await connectToOdoo();
    console.log('Connected to Odoo with UID:', uid);

    // Get sale orders for March 2025
    const month = '2025-03';
    console.log('Fetching orders for month:', month);

    const orders = await getSaleOrders(uid, month, new Request('http://localhost:3000'));
    console.log(`Found ${orders.length} orders`);

    // Find SO S00219
    const targetOrder = orders.find((order: SaleOrder) => order.so === 'S00219');
    
    if (!targetOrder) {
      console.log('SO S00219 not found in March 2025');
      return;
    }

    console.log('\nFound SO S00219:');
    console.log('Order data:', JSON.stringify(targetOrder, null, 2));

    // Check payment status
    console.log('\nChecking payment status...');
    const hasPayment = await checkPaymentStatus(uid, targetOrder, new Request('http://localhost:3000'));
    console.log('Payment status:', hasPayment ? 'PAID' : 'NOT PAID');

    return {
      hasPayment
    };

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testPaymentStatus(); 
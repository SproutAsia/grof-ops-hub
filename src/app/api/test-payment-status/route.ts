import { NextResponse } from 'next/server';
import { connectToOdoo, getSaleOrders, checkPaymentStatus } from '../odoo/route';

export async function GET() {
  try {
    console.log('Starting test for SO S00219...');
    
    // Connect to Odoo
    const uid = await connectToOdoo();
    console.log('Connected to Odoo with UID:', uid);

    // Get sale orders for March 2025
    const month = '2025-03';
    console.log('Fetching orders for month:', month);

    const orders = await getSaleOrders(uid, month);
    console.log(`Found ${orders.length} orders`);

    // Find SO S00219
    const targetOrder = orders.find((order: any) => order.so === 'S00219');
    
    if (!targetOrder) {
      return NextResponse.json({ 
        success: false, 
        message: 'SO S00219 not found in March 2025',
        ordersCount: orders.length
      });
    }

    // Check payment status
    console.log('\nChecking payment status...');
    
    // First check Stripe payments
    console.log('Checking Stripe payments...');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const stripeResponse = await fetch(`${baseUrl}/api/stripe/search-transaction?so=${targetOrder.so}`);
    if (!stripeResponse.ok) {
      throw new Error('Failed to search Stripe transactions');
    }
    const stripeData = await stripeResponse.json();
    console.log('Stripe response:', stripeData);
    
    // Then check Odoo payments
    console.log('\nChecking Odoo payments...');
    const referenceValue = targetOrder.x_studio_related_field_9ma_1ipqq874u;
    console.log('Reference value:', referenceValue);
    
    const paymentXmlRequest = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${process.env.ODOO_DB}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${process.env.ODOO_PASSWORD}</string></value></param>
    <param><value><string>account.payment</string></value></param>
    <param><value><string>search_read</string></value></param>
    <param>
      <value>
        <array>
          <data>
            <value>
              <array>
                <data>
                  <value>
                    <array>
                      <data>
                        <value><string>memo</string></value>
                        <value><string>like</string></value>
                        <value><string>%${referenceValue}%</string></value>
                      </data>
                    </array>
                  </value>
                </data>
              </array>
            </value>
          </data>
        </array>
      </value>
    </param>
    <param>
      <value>
        <struct>
          <member>
            <name>fields</name>
            <value>
              <array>
                <data>
                  <value><string>id</string></value>
                  <value><string>memo</string></value>
                  <value><string>state</string></value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

    console.log('Payment search XML:', paymentXmlRequest);
    
    const paymentResponse = await fetch(`${process.env.ODOO_URL}/xmlrpc/2/object`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      },
      body: paymentXmlRequest
    });

    const paymentResponseText = await paymentResponse.text();
    console.log('Payment response:', paymentResponseText);

    const hasPayment = await checkPaymentStatus(uid, targetOrder);

    return NextResponse.json({ 
      success: true,
      order: targetOrder,
      paymentStatus: hasPayment ? 'PAID' : 'NOT PAID',
      ordersCount: orders.length,
      stripeCheck: stripeData,
      odooCheck: paymentResponseText
    });

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
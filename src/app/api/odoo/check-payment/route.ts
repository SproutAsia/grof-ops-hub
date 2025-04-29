import { NextResponse } from 'next/server';
import { URL } from 'url';

// Parse Odoo URL only if it exists
let odooUrl: URL | null = null;
if (process.env.ODOO_URL) {
  try {
    odooUrl = new URL(process.env.ODOO_URL);
  } catch (error) {
    console.error('Invalid ODOO_URL:', error);
  }
}

// Helper function to extract value from XML-RPC response
function extractValueFromXmlResponse(xmlText: string): any {
  const match = xmlText.match(/<value><int>(\d+)<\/int><\/value>/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Connect to Odoo and get UID
async function connectToOdoo() {
  try {
    if (!process.env.ODOO_URL || !process.env.ODOO_DB || !process.env.ODOO_USERNAME || !process.env.ODOO_PASSWORD) {
      throw new Error('Missing required Odoo environment variables');
    }

    const xmlRequest = `<?xml version="1.0"?>
<methodCall>
  <methodName>authenticate</methodName>
  <params>
    <param><value><string>${process.env.ODOO_DB}</string></value></param>
    <param><value><string>${process.env.ODOO_USERNAME}</string></value></param>
    <param><value><string>${process.env.ODOO_PASSWORD}</string></value></param>
    <param><value><struct/></value></param>
  </params>
</methodCall>`;

    const response = await fetch(`${process.env.ODOO_URL}/xmlrpc/2/common`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      },
      body: xmlRequest
    });

    const responseText = await response.text();
    const uid = extractValueFromXmlResponse(responseText);
    if (!uid) {
      throw new Error('Failed to extract UID from response');
    }

    return uid;
  } catch (error) {
    console.error('Connection error:', error);
    throw error;
  }
}

// Helper function to make XML-RPC request with retries
async function makeXmlRpcRequest(url: string, xmlRequest: string, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Accept': 'text/xml',
        },
        body: xmlRequest
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const soNumber = searchParams.get('so');
    
    if (!soNumber) {
      return NextResponse.json(
        { error: 'SO number is required' },
        { status: 400 }
      );
    }

    // Connect to Odoo
    const uid = await connectToOdoo();

    // Check for payments in account.payment model
    const xmlRequest = `<?xml version="1.0"?>
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
                        <value><string>payment_transaction_id</string></value>
                        <value><string>=</string></value>
                        <value><string>${soNumber}</string></value>
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
                  <value><string>payment_transaction_id</string></value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

    const responseText = await makeXmlRpcRequest(`${process.env.ODOO_URL}/xmlrpc/2/object`, xmlRequest);
    
    // Simple check for payment records in the response
    const hasPayment = responseText.includes('<value><int>') && 
                      responseText.includes('payment_transaction_id') && 
                      responseText.includes(soNumber);

    return NextResponse.json({ hasPayment });
  } catch (error) {
    console.error('Error checking payment status:', error);
    // Return false instead of error to prevent blocking the UI
    return NextResponse.json({ hasPayment: false });
  }
} 
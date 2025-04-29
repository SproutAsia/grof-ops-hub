import { NextResponse } from 'next/server';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Prevent static generation of this route
export const dynamic = 'force-dynamic';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

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
  // Simple XML parsing to get the value
  const match = xmlText.match(/<value><int>(\d+)<\/int><\/value>/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Add this new function to get all partner details in one call
async function getCompanyUen(companyId: number, uid: number): Promise<string> {
  try {
    if (!process.env.ODOO_URL || !process.env.ODOO_DB || !process.env.ODOO_PASSWORD) {
      throw new Error('Missing required Odoo environment variables');
    }

    console.log('Checking UEN from res.company for company ID:', companyId);
    
    const xmlRequest = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${process.env.ODOO_DB}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${process.env.ODOO_PASSWORD}</string></value></param>
    <param><value><string>res.company</string></value></param>
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
                        <value><string>id</string></value>
                        <value><string>=</string></value>
                        <value><int>${companyId}</int></value>
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
                  <value><string>l10n_sg_unique_entity_number</string></value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

    console.log('XML Request for company UEN:', xmlRequest);

    const response = await fetch(`${process.env.ODOO_URL}/xmlrpc/2/object`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      },
      body: xmlRequest
    });

    const responseText = await response.text();
    console.log('Full company UEN response:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const uenMatch = responseText.match(/<member>\s*<name>l10n_sg_unique_entity_number<\/name>\s*<value><string>([^<]+)<\/string><\/value>\s*<\/member>/);
    return uenMatch ? uenMatch[1] : '';
  } catch (error) {
    console.error('Error checking company UEN:', error);
    return '';
  }
}

// Helper function to write response to file
async function writeResponseToFile(response: string, filename: string) {
  try {
    // Create debug-logs directory if it doesn't exist
    const debugLogsDir = path.join(process.cwd(), 'debug-logs');
    if (!fs.existsSync(debugLogsDir)) {
      console.log('Creating debug-logs directory...');
      fs.mkdirSync(debugLogsDir, { recursive: true });
    }

    // Check if directory is writable
    try {
      fs.accessSync(debugLogsDir, fs.constants.W_OK);
    } catch (error) {
      console.error('Directory is not writable:', debugLogsDir);
      throw new Error('Directory is not writable');
    }

    // Generate a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFilename = `${filename.split('.')[0]}-${timestamp}.${filename.split('.').pop()}`;
    
    // Write the file to the debug-logs directory
    const filePath = path.join(debugLogsDir, uniqueFilename);
    console.log('Writing file to:', filePath);
    fs.writeFileSync(filePath, response);
    console.log(`Wrote response to ${filePath}`);
  } catch (error) {
    console.error('Error writing response to file:', error);
    console.error('Attempted to write to path:', path.join(process.cwd(), 'debug-logs', filename));
  }
}

async function getPartnerDetails(partnerId: number, uid: number): Promise<{ email: string; uen: string; phone: string; company_id: number }> {
  try {
    console.log('Fetching all details for partner ID:', partnerId);
    
    const xmlRequest = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${process.env.ODOO_DB}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${process.env.ODOO_PASSWORD}</string></value></param>
    <param><value><string>res.partner</string></value></param>
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
                        <value><string>id</string></value>
                        <value><string>=</string></value>
                        <value><int>${partnerId}</int></value>
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
                  <value><string>email</string></value>
                  <value><string>phone</string></value>
                  <value><string>parent_id</string></value>
                  <value><string>l10n_sg_unique_entity_number</string></value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

    const response = await fetch(`${process.env.ODOO_URL}/xmlrpc/2/object`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      },
      body: xmlRequest
    });

    const responseText = await response.text();
    // Only write to file if debugging is needed
    if (process.env.DEBUG_PARTNER_DETAILS === 'true') {
      await writeResponseToFile(responseText, 'partner-details-response.xml');
    }
    console.log('Full partner details response:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse all details from the response
    const emailMatch = responseText.match(/<member>\s*<name>email<\/name>\s*<value><string>([^<]+)<\/string><\/value>\s*<\/member>/);
    const phoneMatch = responseText.match(/<member>\s*<name>phone<\/name>\s*<value><string>([^<]+)<\/string><\/value>\s*<\/member>/);
    const parentIdMatch = responseText.match(/<member>\s*<name>parent_id<\/name>\s*<value><array><data>\s*<value><int>(\d+)<\/int><\/value>/);
    
    // Get parent company ID if available
    const companyId = parentIdMatch ? parseInt(parentIdMatch[1], 10) : partnerId;

    // Check for UEN value - try both string and boolean formats
    let uen = '';
    const stringUenMatch = responseText.match(/<member>\s*<name>l10n_sg_unique_entity_number<\/name>\s*<value><string>([^<]+)<\/string><\/value>\s*<\/member>/);
    const booleanUenMatch = responseText.match(/<member>\s*<name>l10n_sg_unique_entity_number<\/name>\s*<value><boolean>([^<]+)<\/boolean><\/value>\s*<\/member>/);
    
    if (stringUenMatch) {
      uen = stringUenMatch[1];
    } else if (booleanUenMatch) {
      // If UEN is a boolean, check parent company
      if (parentIdMatch) {
        const parentXmlRequest = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${process.env.ODOO_DB}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${process.env.ODOO_PASSWORD}</string></value></param>
    <param><value><string>res.partner</string></value></param>
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
                        <value><string>id</string></value>
                        <value><string>=</string></value>
                        <value><int>${companyId}</int></value>
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
                  <value><string>l10n_sg_unique_entity_number</string></value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

        const parentResponse = await fetch(`${process.env.ODOO_URL}/xmlrpc/2/object`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml',
            'Accept': 'text/xml',
          },
          body: parentXmlRequest
        });

        const parentResponseText = await parentResponse.text();
        console.log('Parent company response:', parentResponseText);
        
        const parentUenMatch = parentResponseText.match(/<member>\s*<name>l10n_sg_unique_entity_number<\/name>\s*<value><string>([^<]+)<\/string><\/value>\s*<\/member>/);
        if (parentUenMatch) {
          uen = parentUenMatch[1];
        }
      }
    }

    const result = {
      email: emailMatch ? emailMatch[1] : '',
      uen: uen,
      phone: phoneMatch ? phoneMatch[1] : '',
      company_id: companyId
    };

    console.log('Returning partner details:', result);
    return result;
  } catch (error) {
    console.error('Error getting partner details:', error);
    return { email: '', uen: '', phone: '', company_id: partnerId };
  }
}

// Helper function to parse sale orders from XML response
async function parseSaleOrders(xmlText: string, uid: number): Promise<any[]> {
  console.log('Starting to parse XML response...');

  // Log raw XML for debugging
  await writeResponseToFile(xmlText, 'raw-xml-response.xml');

  if (xmlText.includes('<fault>')) {
    console.log('Full XML Response:', xmlText);
    const faultMatch = xmlText.match(/<faultString><value><string>([^]*?)<\/string><\/value><\/faultString>/);
    const faultCodeMatch = xmlText.match(/<faultCode><value><int>(\d+)<\/int><\/value><\/faultCode>/);
    
    if (faultMatch) {
      console.log('Detailed error:', faultMatch[1]);
      throw new Error(`XML-RPC Fault: ${faultMatch[1]}${faultCodeMatch ? ` (Code: ${faultCodeMatch[1]})` : ''}`);
    }
    throw new Error('Unknown XML-RPC fault');
  }

  // Check if the response is empty or malformed
  if (!xmlText.includes('<methodResponse>')) {
    console.log('Invalid XML-RPC response structure:', xmlText);
    throw new Error('Invalid XML-RPC response structure');
  }

  const orders: any[] = [];
  let currentOrder: any = null;
  let currentField: string | null = null;

  // Split the XML into lines for easier processing
  const lines = xmlText.split('\n').map(line => line.trim());
  
  for (const line of lines) {
    // Start of a new order
    if (line === '<value><struct>') {
      currentOrder = {};
      continue;
    }
    
    // End of current order
    if (line === '</struct></value>') {
      if (currentOrder && Object.keys(currentOrder).length > 0) {
        // Add debug logging for dates
        if (currentOrder.so === 'S00022') {
          console.log('S00022 dates:', {
            date_order: currentOrder.date_order,
            create_date: currentOrder.create_date,
            so: currentOrder.so
          });
        }
        orders.push(currentOrder);
      }
      currentOrder = null;
      continue;
    }

    // Start of a member field
    if (line === '<member>') {
      currentField = null;
      continue;
    }

    // Field name
    if (line.startsWith('<name>') && line.endsWith('</name>')) {
      currentField = line.slice(6, -7); // Remove <name> and </name>
      continue;
    }

    // Field value
    if (currentOrder && currentField && line.startsWith('<value>')) {
      try {
      if (currentField === 'id') {
        const match = line.match(/<int>(\d+)<\/int>/);
        if (match) {
          currentOrder.id = parseInt(match[1], 10);
        }
      }
      else if (currentField === 'name') {
        const match = line.match(/<string>([^<]+)<\/string>/);
        if (match) {
          currentOrder.so = match[1];
        }
      }
      else if (currentField === 'date_order') {
        const match = line.match(/<string>([^<]+)<\/string>/);
        if (match) {
          currentOrder.date_order = match[1];
        }
      }
      else if (currentField === 'create_date') {
        const match = line.match(/<string>([^<]+)<\/string>/);
        if (match) {
          currentOrder.create_date = match[1];
        }
      }
      else if (currentField === 'partner_id') {
        // Parse the partner_id array structure
        const idMatch = line.match(/<value><int>(\d+)<\/int><\/value>/);
        const nameMatch = line.match(/<value><string>([^<]+)<\/string><\/value>/);
        
        if (idMatch) {
          const partnerId = parseInt(idMatch[1], 10);
          if (!isNaN(partnerId)) {
            // Store the ID temporarily
            currentOrder.partner_id = [partnerId, ''];
            console.log('Found partner ID:', partnerId);
            
            // Fetch partner details immediately
            console.log('Fetching partner details for ID:', partnerId);
            const { email, uen, phone, company_id } = await getPartnerDetails(partnerId, uid);
            console.log('Partner details response for ID', partnerId, ':', { 
              email, 
              uen, 
              phone, 
              company_id,
              raw_response: await fetch(`${process.env.ODOO_URL}/xmlrpc/2/object`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'text/xml',
                  'Accept': 'text/xml',
                },
                body: `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${process.env.ODOO_DB}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${process.env.ODOO_PASSWORD}</string></value></param>
    <param><value><string>res.partner</string></value></param>
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
                        <value><string>id</string></value>
                        <value><string>=</string></value>
                        <value><int>${partnerId}</int></value>
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
                  <value><string>email</string></value>
                  <value><string>phone</string></value>
                  <value><string>parent_id</string></value>
                  <value><string>l10n_sg_unique_entity_number</string></value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`
              }).then(r => r.text())
            });
            currentOrder.email = email;
            currentOrder.uen = uen;
            currentOrder.phone = phone;
            currentOrder.partner_id = [company_id, currentOrder.partner_id[1]]; // Use company_id instead
          }
        } else if (nameMatch && currentOrder.partner_id) {
          // Update the name in the existing partner_id array
          const partnerName = nameMatch[1];
          currentOrder.partner_id[1] = partnerName;
          console.log('Found partner name:', partnerName);
        }
      }
      else if (currentField === 'amount_total') {
        const match = line.match(/<double>([^<]+)<\/double>/);
        if (match) {
          currentOrder.amount_total = parseFloat(match[1]);
        }
      }
      else if (currentField === 'state') {
        const match = line.match(/<string>([^<]+)<\/string>/);
        if (match) {
          currentOrder.state = match[1];
        }
      }
      else if (currentField === 'user_id') {
        const match = line.match(/<string>([^<]+)<\/string>/);
        if (match) {
          currentOrder.user_id = [0, match[1]]; // We only need the name for now
          console.log('Parsed user_id:', currentOrder.user_id);
        }
      }
      else if (currentField === 'company_id') {
        const idMatch = line.match(/<array><data>\s*<value><int>(\d+)<\/int><\/value>/);
        const nameMatch = line.match(/<value><string>([^<]+)<\/string><\/value>/);
        if (idMatch && nameMatch) {
          currentOrder.company_id = [parseInt(idMatch[1], 10), nameMatch[1]];
        }
      }
        else if (currentField === 'x_studio_cb_subscription_id') {
          const match = line.match(/<string>([^<]+)<\/string>/);
          if (match) {
            currentOrder.x_studio_cb_subscription_id = match[1];
          }
        }
      else if (currentField === 'x_studio_existing_subs_from_chargebee') {
        const match = line.match(/<string>([^<]+)<\/string>/);
        if (match) {
          currentOrder.x_studio_existing_subs_from_chargebee = match[1];
          console.log('Parsed x_studio_existing_subs_from_chargebee:', currentOrder.x_studio_existing_subs_from_chargebee);
        }
      }
      else if (currentField === 'x_studio_related_field_9ma_1ipqq874u') {
        const match = line.match(/<string>([^<]+)<\/string>/);
        if (match) {
          currentOrder.x_studio_related_field_9ma_1ipqq874u = match[1];
          console.log('Parsed x_studio_related_field_9ma_1ipqq874u:', currentOrder.x_studio_related_field_9ma_1ipqq874u);
        }
        }
        else if (currentField === 'x_studio_related_field_2qf_1iprtjf43') {
          const match = line.match(/<string>([^<]+)<\/string>/);
          if (match) {
            currentOrder.x_studio_related_field_2qf_1iprtjf43 = match[1];
            console.log('Parsed x_studio_related_field_2qf_1iprtjf43:', currentOrder.x_studio_related_field_2qf_1iprtjf43);
            
            // Add debug logging for S00219 to file
            if (currentOrder.so === 'S00219') {
              const debugLog = `=== S00219 Debug Info ===\nFull line: ${line}\nMatch result: ${JSON.stringify(match)}\nCurrent order: ${JSON.stringify(currentOrder, null, 2)}\n========================\n`;
              await writeResponseToFile(debugLog, 's00219-field-debug.txt');
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing field ${currentField}:`, error);
        console.error('Line content:', line);
      }
    }
  }

  console.log('All parsed orders with UEN:', orders.map(order => ({
    so: order.so,
    uen: order.uen,
    partner_id: order.partner_id
  })));
  return orders;
}

// Check if XML-RPC endpoint is accessible
async function checkEndpoint() {
  try {
    console.log('Checking XML-RPC endpoint:', `${process.env.ODOO_URL}/xmlrpc/2/common`);
    const response = await fetch(`${process.env.ODOO_URL}/xmlrpc/2/common`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      },
      body: '<?xml version="1.0"?><methodCall><methodName>version</methodName><params></params></methodCall>'
    });
    
    const text = await response.text();
    console.log('Endpoint response:', text);
    return response.ok;
  } catch (error) {
    console.error('Error checking endpoint:', error);
    return false;
  }
}

// Connect to Odoo and get UID
export async function connectToOdoo() {
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

// Update the getSaleOrders function to include payment status check
export async function getSaleOrders(uid: number, month: string, request: Request) {
  if (isBuild) {
    return [];
  }

  try {
    if (!process.env.ODOO_URL || !process.env.ODOO_DB || !process.env.ODOO_PASSWORD) {
      throw new Error('Missing required Odoo environment variables');
    }

    console.log('Getting sale orders for UID:', uid, 'Month:', month);

    // Parse the month parameter (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    
    // Calculate start date (first day of month)
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    
    // Calculate end date (last day of month)
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    console.log('Detailed date parameters:', {
      month,
      year,
      monthNum,
      startDate,
      endDate,
      lastDay,
      isLeapYear: (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0,
      startDateObj: new Date(startDate),
      endDateObj: new Date(endDate)
    });

    const xmlRequest = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param>
      <value>
        <string>${process.env.ODOO_DB}</string>
      </value>
    </param>
    <param>
            <value>
        <int>${uid}</int>
      </value>
    </param>
    <param>
                  <value>
        <string>${process.env.ODOO_PASSWORD}</string>
                  </value>
    </param>
    <param>
      <value>
        <string>sale.order</string>
      </value>
    </param>
    <param>
      <value>
        <string>search_read</string>
      </value>
    </param>
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
                        <value>
                          <string>create_date</string>
                        </value>
                        <value>
                          <string>&gt;=</string>
                        </value>
                        <value>
                          <string>${startDate}</string>
                        </value>
                      </data>
                    </array>
                  </value>
                  <value>
                    <array>
                      <data>
                        <value>
                          <string>create_date</string>
                        </value>
                        <value>
                          <string>&lt;=</string>
                        </value>
                        <value>
                          <string>${endDate}</string>
                        </value>
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
                  <value>
                    <string>name</string>
                  </value>
                  <value>
                    <string>date_order</string>
                  </value>
                  <value>
                    <string>partner_id</string>
                  </value>
                  <value>
                    <string>amount_total</string>
                  </value>
                  <value>
                    <string>state</string>
                  </value>
                  <value>
                    <string>x_studio_existing_subs_from_chargebee</string>
                  </value>
                  <value>
                    <string>x_studio_cb_subscription_id</string>
                  </value>
                  <value>
                    <string>company_id</string>
                  </value>
                  <value>
                    <string>user_id</string>
                  </value>
                  <value>
                    <string>x_studio_related_field_2qf_1iprtjf43</string>
                  </value>
                  <value>
                    <string>id</string>
                  </value>
                  <value>
                    <string>create_date</string>
                  </value>
                </data>
              </array>
            </value>
          </member>
          <member>
            <name>order</name>
            <value>
              <string>date_order desc</string>
            </value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

    const response = await fetch(`${process.env.ODOO_URL}/xmlrpc/2/object`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      },
      body: xmlRequest
    });

    const responseText = await response.text();
    await writeResponseToFile(responseText, 'sale-orders-response.xml');

    console.log('Raw XML response length:', responseText.length);
    console.log('Raw XML response preview:', responseText.substring(0, 500));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const orders = await parseSaleOrders(responseText, uid);
    
    // Add payment status to each order
    for (const order of orders) {
      if (order.so === 'S00219') {
        const debugLog = `=== Processing S00219 ===\nPayment field: ${order.x_studio_related_field_2qf_1iprtjf43}\n`;
        await writeResponseToFile(debugLog, 's00219-state-debug.txt');
      }
      
      // Add payment status based on the payment field
      order.payment_status = order.x_studio_related_field_2qf_1iprtjf43 === 'paid' ? 'Paid' : '';
    }
    
    // Log final state of S00219
    const s00219 = orders.find(order => order.so === 'S00219');
    if (s00219) {
      const debugLog = `=== Final State of S00219 ===\nPayment status: ${s00219.payment_status}\nPayment field: ${s00219.x_studio_related_field_2qf_1iprtjf43}\n`;
      await writeResponseToFile(debugLog, 's00219-state-debug.txt');
    }

    return orders;
  } catch (error) {
    console.error('Error fetching sale orders:', error);
    return [];
  }
}

// Update the GET function to pass the request to getSaleOrders
export async function GET(request: Request) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const so = searchParams.get('so');

    // If SO parameter is provided, check payment status
    if (so) {
      const uid = await connectToOdoo();
      const hasPayment = await checkPaymentStatus(uid, { 
        so: so,
        x_studio_related_field_9ma_1ipqq874u: so 
      }, request);
      return NextResponse.json(hasPayment);
    }

    // Always check S00219's payment status when the page loads
    const uid = await connectToOdoo();
    console.log('=== Checking S00219 payment status ===');
    const s00219PaymentStatus = await checkPaymentStatus(uid, {
      so: 'S00219',
      x_studio_related_field_9ma_1ipqq874u: 'INV/2025/00070'
    }, request);
    console.log('S00219 payment status:', s00219PaymentStatus);

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
    }
    
    // Get sale orders using XML-RPC
    const orders = await getSaleOrders(uid, month, request);

    // Fetch all follow-ups for these sales
    const saleIds = orders.map((order: any) => order.id?.toString());
    const followUps = await prisma.followUp.findMany({
      where: {
        saleId: {
          in: saleIds,
        },
      },
      orderBy: {
        createDate: 'desc',
      },
    });

    // Group follow-ups by saleId
    const followUpsBySaleId = followUps.reduce((acc: { [key: string]: typeof followUps }, followUp: typeof followUps[0]) => {
      if (!acc[followUp.saleId]) {
        acc[followUp.saleId] = [];
      }
      acc[followUp.saleId].push(followUp);
      return acc;
    }, {});

    // Add follow-up data to each order
    const ordersWithFollowUps = orders.map((order: any) => {
      const orderId = order.id?.toString();
      const orderFollowUps = followUpsBySaleId[orderId] || [];
      const lastFollowUp = orderFollowUps[0];

      return {
        ...order,
        followUpChannels: lastFollowUp?.channels || [],
        followUpNotes: lastFollowUp?.notes || '',
        followUpCount: orderFollowUps.length,
        lastFollowUpDate: lastFollowUp ? lastFollowUp.createDate : new Date(),
      };
    });
    
    return NextResponse.json(ordersWithFollowUps);
  } catch (error) {
    console.error('Error in Odoo API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update checkPaymentStatus to just check the payment field
export async function checkPaymentStatus(uid: number, order: any, request: Request): Promise<boolean> {
  if (isBuild) {
    return false;
  }

  try {
    if (!order || !order.so) {
      await writeResponseToFile('Invalid order object or missing SO number\n', 'payment-status-debug.txt');
      return false;
    }

    // Debug logging for S00219
    if (order.so === 'S00219') {
      const debugLog = `=== Checking S00219 Payment Status ===\nOrder object: ${JSON.stringify(order, null, 2)}\nPayment field value: ${order.x_studio_related_field_2qf_1iprtjf43}\n`;
      await writeResponseToFile(debugLog, 's00219-payment-debug.txt');
    }

    // First check Stripe payments by matching SO number with description
    const stripeLog = `Checking Stripe payment for SO: ${order.so}\n`;
    await writeResponseToFile(stripeLog, 'payment-status-debug.txt');
    
    // Construct base URL from request
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const stripeUrl = `${baseUrl}/api/stripe/search-transaction?so=${order.so}`;
    await writeResponseToFile(`Making request to: ${stripeUrl}\n`, 'payment-status-debug.txt');
    
    const stripeResponse = await fetch(stripeUrl);
    if (!stripeResponse.ok) {
      await writeResponseToFile('Failed to search Stripe transactions\n', 'payment-status-debug.txt');
      throw new Error('Failed to search Stripe transactions');
    }
    const stripeData = await stripeResponse.json();
    
    if (stripeData.paymentIntent && stripeData.paymentIntent.status === 'succeeded') {
      await writeResponseToFile(`Found paid Stripe transaction for SO: ${order.so}\n`, 'payment-status-debug.txt');
      return true;
    }

    // Check Odoo payment status from sale.order
    if (order.x_studio_related_field_2qf_1iprtjf43 === 'paid') {
      await writeResponseToFile(`Found paid Odoo payment for SO: ${order.so}\n`, 'payment-status-debug.txt');
      return true;
    }
    
    await writeResponseToFile(`No paid payment found for SO: ${order.so}\n`, 'payment-status-debug.txt');
    return false;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return false;
  }
} 
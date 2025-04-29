// Remove all Stripe-related imports and initialization
// Keep only the functions that make API calls

export async function getPaymentStatusFromStripe(soNumber: string): Promise<'Paid' | ''> {
  try {
    console.log('Searching for Stripe transaction with SO:', soNumber);
    const response = await fetch(`/api/stripe/search-transaction?so=${soNumber}`);
    if (!response.ok) {
      throw new Error('Failed to search Stripe transactions');
    }
    const data = await response.json();
    
    if (data.paymentIntent && data.paymentIntent.status === 'succeeded') {
      console.log('Found paid Stripe transaction for SO:', soNumber);
      return 'Paid';
    }
    
    console.log('No paid Stripe transaction found for SO:', soNumber);
    return '';
  } catch (error) {
    console.error('Error searching Stripe transactions:', error);
    return '';
  }
}

export async function getPaymentStatus(soNumber: string, odooStatus: string): Promise<'Paid' | ''> {
  // Add special logging for SO S00049
  if (soNumber === 'S00049') {
    console.log('Checking payment status for SO S00049');
  }

  // First, try to get status from Stripe
  const stripeStatus = await getPaymentStatusFromStripe(soNumber);
  
  // If we found a Stripe status, use it
  if (stripeStatus) {
    if (soNumber === 'S00049') {
      console.log('Found Stripe status for SO S00049:', stripeStatus);
    }
    return stripeStatus;
  }
  
  // If no Stripe status, check Odoo payment transactions
  try {
    const response = await fetch(`/api/odoo/check-payment?so=${soNumber}`);
    if (!response.ok) {
      throw new Error('Failed to check Odoo payment status');
    }
    const data = await response.json();
    
    if (soNumber === 'S00049') {
      console.log('Odoo payment check result for S00049:', data);
    }
    
    return data.hasPayment ? 'Paid' : '';
  } catch (error) {
    console.error('Error checking Odoo payment status:', error);
    return '';
  }
}

export async function getPaymentIntentIdFromOrder(orderId: string): Promise<string | null> {
  try {
    console.log('Getting payment intent ID for order:', orderId);
    // This is a placeholder - you'll need to implement the logic to get the Stripe payment intent ID
    // from your order. This could be stored in a database or in Odoo.
    return null;
  } catch (error) {
    console.error('Error getting payment intent ID:', error);
    return null;
  }
} 
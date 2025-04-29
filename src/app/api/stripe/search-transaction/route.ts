import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

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

    console.log('Searching Stripe transactions for SO:', soNumber);

    // Search for payment intents with the SO number in the description
    try {
      const paymentIntents = await stripe.paymentIntents.search({
        query: `description:"${soNumber}"`,
        limit: 1
      });

      console.log('Payment Intents search results:', paymentIntents.data);

      if (paymentIntents.data.length > 0) {
        console.log('Found payment intent:', paymentIntents.data[0]);
        return NextResponse.json({ paymentIntent: paymentIntents.data[0] });
      }
    } catch (error) {
      console.error('Error searching payment intents:', error);
    }

    // If no payment intent found, try searching charges
    try {
      const charges = await stripe.charges.search({
        query: `description:"${soNumber}"`,
        limit: 1
      });

      console.log('Charges search results:', charges.data);

      if (charges.data.length > 0) {
        // Get the payment intent for the charge
        const paymentIntent = await stripe.paymentIntents.retrieve(charges.data[0].payment_intent as string);
        console.log('Found charge, retrieved payment intent:', paymentIntent);
        return NextResponse.json({ paymentIntent });
      }
    } catch (error) {
      console.error('Error searching charges:', error);
    }

    console.log('No Stripe transactions found for SO:', soNumber);
    return NextResponse.json({ paymentIntent: null });
  } catch (error) {
    console.error('Error searching Stripe transactions:', error);
    return NextResponse.json(
      { error: 'Failed to search transactions' },
      { status: 500 }
    );
  }
} 
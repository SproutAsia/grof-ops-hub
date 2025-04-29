import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Prevent static generation of this route
export const dynamic = 'force-dynamic';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Initialize Stripe only if not in build environment
const stripe = !isBuild ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
}) : null;

export async function POST(request: Request) {
  if (isBuild) {
    return NextResponse.json({ message: 'Webhook not available during build' }, { status: 200 });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe client not initialized' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      // Here you would update your database with the payment status
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed:', failedPaymentIntent.id);
      // Here you would update your database with the failed status
      break;
    // Add more event types as needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 
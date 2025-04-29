import Stripe from 'stripe';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Initialize Stripe client only if not in build environment
const stripe = !isBuild && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    })
  : null;

export async function getPaymentIntent(paymentIntentId: string) {
  if (isBuild || !stripe) {
    return null;
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
} 
import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe-server';

// Prevent static generation of this route
export const dynamic = 'force-dynamic';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

export async function GET(request: Request) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const so = searchParams.get('so');

    if (!so) {
      return NextResponse.json(
        { error: 'SO number is required' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const paymentIntents = await stripe.paymentIntents.search({
      query: `metadata['so']:'${so}'`,
    });

    return NextResponse.json(paymentIntents);
  } catch (error) {
    console.error('Error searching Stripe transactions:', error);
    return NextResponse.json(
      { error: 'Failed to search transactions' },
      { status: 500 }
    );
  }
} 
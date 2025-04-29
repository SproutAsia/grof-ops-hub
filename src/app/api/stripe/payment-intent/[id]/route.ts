import { NextResponse } from 'next/server';
import { getPaymentIntent } from '@/lib/stripe-server';

// Prevent static generation of this route
export const dynamic = 'force-dynamic';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  try {
    const paymentIntent = await getPaymentIntent(params.id);
    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment intent' },
      { status: 500 }
    );
  }
} 
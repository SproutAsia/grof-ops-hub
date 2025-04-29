import { NextResponse } from 'next/server';
import { getPaymentIntent } from '@/lib/stripe-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paymentIntent = await getPaymentIntent(params.id);
    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment intent' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { fetchRenewalCollectionData } from '@/services/renewalCollectionService';

export async function GET() {
  try {
    const data = await fetchRenewalCollectionData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in renewal collection API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch renewal collection data' },
      { status: 500 }
    );
  }
} 
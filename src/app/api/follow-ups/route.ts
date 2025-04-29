import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Prevent static generation of this route
export const dynamic = 'force-dynamic';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Initialize Prisma only if not in build environment
const prisma = !isBuild ? new PrismaClient() : null;

export async function POST(request: Request) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Unauthorized attempt to create follow-up');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { saleId, channels, notes } = await request.json();
    console.log('Creating follow-up with data:', { saleId, channels, notes, userEmail: session.user.email });

    const followUp = await prisma.followUp.create({
      data: {
        saleId,
        channels,
        notes,
        userId: session.user.email || '',
        userEmail: session.user.email || '',
      },
    }); 

    console.log('Follow-up created successfully:', followUp);
    return NextResponse.json(followUp);
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Unauthorized attempt to fetch follow-ups');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');

    if (!saleId) {
      console.log('Missing saleId in follow-up fetch request');
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    console.log('Fetching follow-ups for saleId:', saleId);
    const followUps = await prisma.followUp.findMany({
      where: {
        saleId,
      },
      orderBy: {
        createDate: 'desc',
      },
    });

    console.log('Found follow-ups:', followUps);
    return NextResponse.json(followUps);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
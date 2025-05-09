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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followUpId = params.id;
    if (!followUpId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }

    // Delete the follow-up
    await prisma.followUp.delete({
      where: { id: followUpId },
    });

    return NextResponse.json({ message: 'Follow-up deleted successfully' });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followUpId = params.id;
    if (!followUpId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }

    // Fetch the follow-up
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
    });

    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    return NextResponse.json(followUp);
  } catch (error) {
    console.error('Error fetching follow-up:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (isBuild) {
    return NextResponse.json({ message: 'API route not available during build' }, { status: 200 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followUpId = params.id;
    if (!followUpId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }

    const { channels, notes } = await request.json();

    // Update the follow-up
    const updatedFollowUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        channels,
        notes,
      },
    });

    return NextResponse.json(updatedFollowUp);
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
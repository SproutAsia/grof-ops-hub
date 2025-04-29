import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Prevent static generation of this route
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
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
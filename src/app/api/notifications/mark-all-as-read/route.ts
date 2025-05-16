import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    const result = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        read: false, 
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      message: 'All unread notifications marked as read.',
      count: result.count, // Number of notifications updated
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
} 
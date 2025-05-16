import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params =  Promise<{ notificationId: string }>;

export async function PATCH(request: NextRequest, { params }: {params: Params}) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    const { notificationId } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Ensure the notification belongs to the requesting user
    if (notification.recipientId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this notification' },
        { status: 403 }
      );
    }

    // If already read, no need to update, just return it or a success message
    if (notification.read) {
      return NextResponse.json(notification);
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, NotificationType } from '@prisma/client'; // Import Prisma namespace and NotificationType enum

// 1. Define the payload structure for a notification with its relations
const notificationPayload = Prisma.validator<Prisma.NotificationDefaultArgs>()({
  include: {
    triggeringUser: { select: { id: true, username: true } },
    post: { select: { id: true, title: true } },
    comment: { select: { id: true, textContent: true } },
  },
});

// 2. Infer the TypeScript type from this payload structure
type PopulatedNotification = Prisma.NotificationGetPayload<typeof notificationPayload>;

// Zod schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Zod schema for the transformed notification (API response shape)
const apiNotificationSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  read: z.boolean(),
  type: z.nativeEnum(NotificationType), // Use the imported NotificationType enum directly
  triggeringUser: z.object({
    id: z.string(),
    username: z.string(),
  }).nullable(),
  post: z.object({
    id: z.string(),
    title: z.string(),
  }).nullable(),
  comment: z.object({
    id: z.string(),
    textContent: z.string().nullable(), // textContent can be null from schema
  }).nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.format() },
        { status: 400 }
      );
    }

    const { page, limit } = parsedQuery.data;
    const skip = (page - 1) * limit;

    const [notifications, totalNotifications] = await Promise.all([
      prisma.notification.findMany({
        where: {
          recipientId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: skip,
        // Use the predefined payload for includes/selects
        ...notificationPayload,
      }),
      prisma.notification.count({
        where: {
          recipientId: userId,
        },
      }),
    ]);

    // Now, notifications should be of type PopulatedNotification[]
    const transformedNotifications = notifications.map((n: PopulatedNotification) => ({
      id: n.id,
      createdAt: n.createdAt,
      read: n.read,
      type: n.type,
      triggeringUser: n.triggeringUser, // This will be null if not included or doesn't exist
      post: n.post ? { id: n.post.id, title: n.post.title } : null,
      comment: n.comment ? { id: n.comment.id, textContent: n.comment.textContent?.substring(0, 100) } : null,
    }));
    
    // Validate the output against the Zod schema (optional, but good for ensuring contract)
    const validatedResponse = z.array(apiNotificationSchema).safeParse(transformedNotifications);
    if (!validatedResponse.success) {
        // Handle validation error, e.g., log it, but maybe still send data if it's a minor mismatch
        console.error("API response validation error for notifications:", validatedResponse.error);
        // Decide if you want to return an error or the potentially mismatched data
    }

    const totalPages = Math.ceil(totalNotifications / limit);

    return NextResponse.json({
      notifications: transformedNotifications, // or validatedResponse.data if you want to be strict
      page,
      limit,
      totalPages,
      totalNotifications,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
} 
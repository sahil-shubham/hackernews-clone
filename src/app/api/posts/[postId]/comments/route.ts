import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';

// Define types for transformed comments
interface TransformedComment {
  id: string;
  textContent: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: Date;
  points: number;
  voteType: string | null;
  hasVoted: boolean;
  replies: TransformedComment[];
}

type Params = Promise<{ postId: string }>

// Type for comment with relations
interface CommentWithRelations {
  id: string;
  textContent: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
  _count: {
    votes: number;
  };
  votes?: Array<{ voteType: string }>;
}

// Validate comment creation
const commentSchema = z.object({
  textContent: z.string().min(1),
  parentId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { postId } = await params;
    
    // Get userId from header if available
    const userId = request.headers.get('x-user-id');
    
    // Check if post exists
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    
    if (!postExists) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Fetch top-level comments first
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
        votes: userId ? {
          where: {
            userId,
          },
          select: {
            voteType: true,
          },
        } : false,
      },
    });
    
    // Transform comments
    const transformedComments = await Promise.all(
      comments.map(async (comment: CommentWithRelations) => {
        const userVote = comment.votes && comment.votes.length > 0 ? comment.votes[0] : null;
        
        // Recursively fetch replies
        const replies = await fetchReplies(comment.id, userId);
        
        return {
          id: comment.id,
          textContent: comment.textContent,
          author: comment.author,
          createdAt: comment.createdAt,
          points: comment._count.votes,
          voteType: userVote?.voteType || null,
          hasVoted: Boolean(userVote),
          replies,
        };
      })
    );
    
    return NextResponse.json({ comments: transformedComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { postId } = await params;
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const result = commentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { textContent, parentId } = result.data;
    
    // Check if post exists and get its authorId for potential notification
    const postData = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    
    if (!postData) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    let parentCommentAuthorId: string | null = null;
    // If parentId is provided, verify it exists and get its authorId
    if (parentId) {
      const parentCommentData = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, authorId: true },
      });
      
      if (!parentCommentData) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
      parentCommentAuthorId = parentCommentData.authorId;
    }
    
    // Create comment
    const comment = await prisma.comment.create({
      data: {
        textContent,
        author: {
          connect: { id: userId },
        },
        post: {
          connect: { id: postId },
        },
        ...(parentId && {
          parent: {
            connect: { id: parentId },
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    
    // --- Notification Logic ---
    if (parentId && parentCommentAuthorId && parentCommentAuthorId !== userId) {
      // It's a reply, and the replier is not the parent comment's author
      await prisma.notification.create({
        data: {
          type: NotificationType.REPLY_TO_COMMENT,
          recipientId: parentCommentAuthorId,
          triggeringUserId: userId,
          postId: postId,
          commentId: comment.id,
        },
      });
    } else if (!parentId && postData.authorId !== userId) {
      // It's a direct comment on a post, and commenter is not the post's author
      await prisma.notification.create({
        data: {
          type: NotificationType.NEW_COMMENT_ON_POST,
          recipientId: postData.authorId,
          triggeringUserId: userId,
          postId: postId,
          commentId: comment.id,
        },
      });
    }
    // --- End Notification Logic ---

    return NextResponse.json(
      {
        id: comment.id,
        textContent: comment.textContent,
        author: comment.author,
        createdAt: comment.createdAt,
        points: 0,
        voteType: null,
        hasVoted: false,
        replies: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// Helper function to recursively fetch replies
async function fetchReplies(parentId: string, userId: string | null): Promise<TransformedComment[]> {
  const replies = await prisma.comment.findMany({
    where: {
      parentId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
      _count: {
        select: {
          votes: true,
        },
      },
      votes: userId ? {
        where: {
          userId,
        },
        select: {
          voteType: true,
        },
      } : false,
    },
  });
  
  return await Promise.all(
    replies.map(async (reply: CommentWithRelations) => {
      const userVote = reply.votes && reply.votes.length > 0 ? reply.votes[0] : null;
      
      // Recursively fetch nested replies
      const nestedReplies = await fetchReplies(reply.id, userId);
      
      return {
        id: reply.id,
        textContent: reply.textContent,
        author: reply.author,
        createdAt: reply.createdAt,
        points: reply._count.votes,
        voteType: userVote?.voteType || null,
        hasVoted: Boolean(userVote),
        replies: nestedReplies,
      };
    })
  );
} 
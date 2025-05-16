import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validate vote type input
const voteSchema = z.object({
  voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
});

type Params = Promise<{ commentId: string }>

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    const { commentId } = await params;

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const result = voteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { voteType } = result.data;

    // Check if user has already voted on this comment
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_commentId: { // Assumes @@unique([userId, commentId]) exists on Vote model
          userId,
          commentId,
        },
      },
    });

    if (existingVote && existingVote.voteType === voteType) {
      // User is clicking the same vote type again - remove the vote (toggle)
      await prisma.vote.delete({
        where: {
          id: existingVote.id,
        },
      });
    } else if (existingVote) {
      // User is changing their vote
      await prisma.vote.update({
        where: {
          id: existingVote.id,
        },
        data: {
          voteType,
        },
      });
    } else {
      // New vote
      await prisma.vote.create({
        data: {
          voteType,
          user: {
            connect: { id: userId },
          },
          comment: { // Link to comment, not post
            connect: { id: commentId },
          },
        },
      });
    }

    // Calculate new score for the comment
    // Count upvotes as +1, downvotes as -1 (or just count total for simplicity as per current post logic)
    // For consistency with how Post points are calculated (simple count), let's do a simple count here too.
    // A more accurate score would be SUM(upvotes) - SUM(downvotes)
    const upvotes = await prisma.vote.count({
      where: { commentId, voteType: 'UPVOTE' },
    });
    const downvotes = await prisma.vote.count({
      where: { commentId, voteType: 'DOWNVOTE' },
    });
    const newScore = upvotes - downvotes;


    return NextResponse.json({
      message: 'Vote recorded successfully',
      newScore: newScore,
    });

  } catch (error) {
    console.error('Comment vote error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.format() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error while voting on comment' },
      { status: 500 }
    );
  }
} 
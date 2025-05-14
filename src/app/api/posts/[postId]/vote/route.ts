import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validate vote type input
const voteSchema = z.object({
  voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }
    
    const { postId } = params;
    
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
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
    
    // Check if user has already voted on this post
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    
    // If vote already exists and has the same type, remove it (toggle voting)
    if (existingVote && existingVote.voteType === voteType) {
      await prisma.vote.delete({
        where: {
          id: existingVote.id,
        },
      });
      
      // Count votes after deletion
      const voteCount = await prisma.vote.count({
        where: { postId },
      });
      
      return NextResponse.json({ 
        message: 'Vote removed successfully',
        score: voteCount,
      });
    }
    
    // If vote exists but with different type, update it
    if (existingVote) {
      await prisma.vote.update({
        where: {
          id: existingVote.id,
        },
        data: {
          voteType,
        },
      });
    } 
    // Otherwise create a new vote
    else {
      await prisma.vote.create({
        data: {
          voteType,
          user: {
            connect: { id: userId },
          },
          post: {
            connect: { id: postId },
          },
        },
      });
    }
    
    // Count votes after update/creation
    const voteCount = await prisma.vote.count({
      where: { postId },
    });
    
    return NextResponse.json({ 
      message: 'Vote recorded successfully',
      score: voteCount,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis'; // Import the Redis client

// Validate vote type input
const voteSchema = z.object({
  voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
});

type Params = Promise<{ postId: string }>

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }
    
    const { postId } = await params;
    
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
    
    let message = 'Vote recorded successfully';
    let operationPerformed = false;

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
      message = 'Vote removed successfully';
      operationPerformed = true;
    }
    // If vote exists but with different type, update it
    else if (existingVote) {
      await prisma.vote.update({
        where: {
          id: existingVote.id,
        },
        data: {
          voteType,
        },
      });
      operationPerformed = true;
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
      operationPerformed = true;
    }
    
    // Count votes after update/creation
    const voteCount = await prisma.vote.count({
      where: { postId }, // Only count votes for the current post to determine its score
    });

    // Invalidate caches if a vote operation was performed and Redis is available
    // if (operationPerformed && redis) {
    //   const defaultLimit = 30; // Assuming this is the common limit for cached lists
    //   const cacheKeysToInvalidate = [
    //     `posts:top:page:1:limit:${defaultLimit}`,
    //     `posts:best:page:1:limit:${defaultLimit}`,
    //     // Potentially invalidate the individual post cache if you implement it
    //     // `post:${postId}` 
    //   ];

    //   try {
    //     for (const key of cacheKeysToInvalidate) {
    //       await redis.del(key);
    //       console.log(`Cache INVALIDATED for key: ${key} due to vote on post ${postId}`);
    //     }
    //   } catch (cacheError) {
    //     console.error(`Redis DEL error during vote processing for post ${postId}:`, cacheError);
    //     // Continue even if cache invalidation fails
    //   }
    // }
    
    return NextResponse.json({ 
      message,
      score: voteCount, // This score is specific to the post voted on
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
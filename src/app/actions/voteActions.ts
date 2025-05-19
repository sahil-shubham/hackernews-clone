'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSideUser } from '@/lib/authUtils';
import type { VoteType as PrismaVoteType } from '@prisma/client';

interface VoteActionResult {
  success: boolean;
  message?: string;
  updatedPoints?: number;
  newVoteType?: PrismaVoteType | null;
}

async function calculatePoints(itemId: string, type: 'post' | 'comment'): Promise<number> {
  const votes = await prisma.vote.findMany({
    where: type === 'post' ? { postId: itemId } : { commentId: itemId },
    select: { voteType: true },
  });
  return votes.reduce((acc, vote) => {
    if (vote.voteType === 'UPVOTE') return acc + 1;
    if (vote.voteType === 'DOWNVOTE') return acc - 1;
    return acc;
  }, 0);
}

/**
 * Handles voting on a post.
 */
export async function voteOnPost(
  postId: string,
  voteType: PrismaVoteType,
): Promise<VoteActionResult> {
  const user = await getServerSideUser();
  if (!user) {
    return { success: false, message: 'Authentication required.' };
  }
  const userId = user.id;

  console.log(`Server Action (Prisma): User ${userId} voting ${voteType} on post ${postId}`);

  try {
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let newVoteTypeForUser: PrismaVoteType | null = voteType;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // User is clicking the same vote button again (undo vote)
        await prisma.vote.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
        newVoteTypeForUser = null;
      } else {
        // User is changing their vote
        await prisma.vote.update({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          data: { voteType },
        });
      }
    } else {
      // New vote
      await prisma.vote.create({
        data: {
          userId,
          postId,
          voteType,
        },
      });
    }

    const updatedPoints = await calculatePoints(postId, 'post');

    revalidatePath('/');
    revalidatePath(`/post/${postId}`);
    revalidatePath('/search');
    if (user.username) {
        revalidatePath(`/user/${user.username}`); // Revalidate user's own profile page if they voted
    }
    // Potentially revalidate the author's profile page if you display posts there
    // const postAuthor = await prisma.post.findUnique({ where: {id: postId}, select: { author: { select: { username: true}}}});
    // if (postAuthor?.author.username) revalidatePath(`/user/${postAuthor.author.username}`);


    return {
      success: true,
      updatedPoints,
      newVoteType: newVoteTypeForUser,
    };
  } catch (error) {
    console.error('Error in voteOnPost server action (Prisma):', error);
    const message = error instanceof Error ? error.message : 'Server action failed to vote on post.';
    return {
      success: false,
      message,
    };
  }
}

/**
 * Handles voting on a comment.
 */
export async function voteOnComment(
  commentId: string,
  voteType: PrismaVoteType,
  postId: string, // Still needed for revalidating the post page
): Promise<VoteActionResult> {
  const user = await getServerSideUser();
  if (!user) {
    return { success: false, message: 'Authentication required.' };
  }
  const userId = user.id;

  console.log(`Server Action (Prisma): User ${userId} voting ${voteType} on comment ${commentId}`);

  try {
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    let newVoteTypeForUser: PrismaVoteType | null = voteType;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await prisma.vote.delete({
          where: {
            userId_commentId: {
              userId,
              commentId,
            },
          },
        });
        newVoteTypeForUser = null;
      } else {
        await prisma.vote.update({
          where: {
            userId_commentId: {
              userId,
              commentId,
            },
          },
          data: { voteType },
        });
      }
    } else {
      await prisma.vote.create({
        data: {
          userId,
          commentId,
          postId, // Include postId if your Vote model for comments requires it for relation or filtering
          voteType,
        },
      });
    }

    const updatedPoints = await calculatePoints(commentId, 'comment');

    revalidatePath(`/post/${postId}`);
    // Also revalidate user's profile if they voted on a comment that might appear there
    if (user.username) {
      revalidatePath(`/user/${user.username}`);
    }

    return {
      success: true,
      updatedPoints,
      newVoteType: newVoteTypeForUser,
    };
  } catch (error) {
    console.error('Error in voteOnComment server action (Prisma):', error);
    const message = error instanceof Error ? error.message : 'Server action failed to vote on comment.';
    return {
      success: false,
      message,
    };
  }
} 
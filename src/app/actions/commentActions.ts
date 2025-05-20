'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSideUser } from '@/lib/authUtils';
import type { Comment as PrismaComment, VoteType as PrismaVoteType } from '@prisma/client';
import type { Comment as FrontendCommentType } from '@/types/comment';

interface ReplyActionResult {
  success: boolean;
  message?: string;
  newComment?: FrontendCommentType;
}

export async function submitComment(
  parentId: string | null,
  text: string,
  postId: string
): Promise<ReplyActionResult> {
  const user = await getServerSideUser();
  if (!user) {
    return { success: false, message: 'Authentication required.' };
  }

  if (!text.trim()) {
    return { success: false, message: 'Reply text cannot be empty.' };
  }

  try {
    const createdComment = await prisma.comment.create({
      data: {
        textContent: text,
        authorId: user.id,
        postId: postId,
        // parentId can be null if it's a top-level comment to the post itself,
        // or it should always be a string if replies are only to other comments.
        // Adjust based on your application logic and schema.
        ...(parentId && { parentId: parentId }), 
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    revalidatePath(`/post/${postId}`); // Revalidate the post page to show the new comment

    // Construct the FrontendCommentType object
    const newFrontendComment: FrontendCommentType = {
      id: createdComment.id,
      textContent: createdComment.textContent,
      author: createdComment.author,
      createdAt: createdComment.createdAt.toISOString(),
      points: 0,
      voteType: undefined,
      hasVoted: false,
      replies: [],
    };

    return {
      success: true,
      message: parentId ? 'Reply submitted successfully.' : 'Comment submitted successfully.',
      newComment: newFrontendComment,
    };
  } catch (error) {
    console.error('Error submitting reply:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit reply.';
    return { success: false, message };
  }
} 
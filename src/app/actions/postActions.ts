'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSideUser } from '@/lib/authUtils';
import type { Post, PostType } from '@prisma/client';

interface CreatePostParams {
  title: string;
  url?: string | null;
  textContent?: string | null;
  type: PostType;
}

interface CreatePostResult {
  success: boolean;
  message?: string;
  postId?: string;
  // You could also return the full post object if needed for some client-side optimistic updates
  // post?: Post & { author: { username: string } }; 
}

export async function createPost(
  params: CreatePostParams
): Promise<CreatePostResult> {
  const user = await getServerSideUser();
  if (!user) {
    return { success: false, message: 'Authentication required.' };
  }

  const { title, url, textContent, type } = params;

  // Basic server-side validation (client-side validation should also exist)
  if (!title.trim()) {
    return { success: false, message: 'Title is required.' };
  }
  if (type === 'LINK' && (!url || !url.trim())) {
    return { success: false, message: 'URL is required for link posts.' };
  }
  if (type === 'LINK' && url && url.trim()) {
    try {
      new URL(url.trim()); // Validate URL format
    } catch (_) {
      return { success: false, message: 'Invalid URL format.' };
    }
  }
  if (type === 'TEXT' && (!textContent || !textContent.trim())) {
    return { success: false, message: 'Text content is required for text posts.' };
  }

  try {
    const newPost = await prisma.post.create({
      data: {
        title: title.trim(),
        url: type === 'LINK' ? url?.trim() : null,
        textContent: type === 'TEXT' ? textContent?.trim() : null,
        type: type,
        authorId: user.id,
        // Initialize points or other fields if necessary
        // points: 0, // Example if you track points directly on the post model
      },
    });

    // Revalidate paths where posts are displayed
    revalidatePath('/'); // Homepage
    if (user.username) {
      revalidatePath(`/user/${user.username}`); // User's own profile page
    }
    revalidatePath(`/post/${newPost.id}`); // The new post's page itself
    revalidatePath('/search'); // Search results

    return {
      success: true,
      message: 'Post created successfully.',
      postId: newPost.id,
    };
  } catch (error) {
    console.error('Error creating post:', error);
    const message = error instanceof Error ? error.message : 'Failed to create post.';
    return { success: false, message };
  }
} 
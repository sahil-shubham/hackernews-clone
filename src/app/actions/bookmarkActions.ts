'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSideUser } from '@/lib/authUtils'
import { Bookmark } from '@prisma/client'

export async function getBookmarkByPostIdAction(postId: string): Promise<Bookmark | null> {
  const user = await getServerSideUser()
  if (!user?.id) {
    throw new Error('Unauthorized: User not logged in')
  }

  try {
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        postId,
        userId: user.id,
      },
    })
    return bookmark
  } catch (error) {
    console.error('Error fetching bookmark by postId:', error)
    throw new Error('Failed to fetch bookmark')
  }
}

export async function createBookmarkAction(postId: string): Promise<Bookmark> {
  const user = await getServerSideUser()
  if (!user?.id) {
    throw new Error('Unauthorized: User not logged in')
  }

  if (!postId) {
    throw new Error('Post ID is required')
  }

  try {
    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        postId,
        userId: user.id,
      },
    })

    if (existingBookmark) {
      throw new Error('Bookmark already exists')
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        postId,
        userId: user.id,
      },
    })

    revalidatePath('/bookmarks')
    return bookmark
  } catch (error) {
    console.error('Error creating bookmark:', error)
    // Explicitly check for the "Bookmark already exists" error to avoid re-throwing it as a generic "Failed to create bookmark"
    if (error instanceof Error && error.message === 'Bookmark already exists') {
        throw error;
    }
    throw new Error('Failed to create bookmark')
  }
}

export async function deleteBookmarkAction(bookmarkId: string): Promise<void> {
  const user = await getServerSideUser()
  if (!user?.id) {
    throw new Error('Unauthorized: User not logged in')
  }

  if (!bookmarkId) {
    throw new Error('Bookmark ID is required')
  }

  try {
    // Verify the bookmark belongs to the current user before deleting
    const bookmarkToDelete = await prisma.bookmark.findUnique({
        where: { id: bookmarkId },
    });

    if (!bookmarkToDelete) {
        throw new Error("Bookmark not found");
    }

    if (bookmarkToDelete.userId !== user.id) {
        throw new Error("Unauthorized: User cannot delete this bookmark");
    }

    await prisma.bookmark.delete({
      where: {
        id: bookmarkId,
        // Ensuring userId matches is a good practice, though covered by the check above
        userId: user.id,
      },
    })

    revalidatePath('/bookmarks')
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    if (error instanceof Error && (error.message === "Bookmark not found" || error.message.startsWith("Unauthorized"))) {
        throw error;
    }
    throw new Error('Failed to delete bookmark')
  }
} 
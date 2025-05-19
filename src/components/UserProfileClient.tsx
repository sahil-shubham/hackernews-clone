/// <reference lib="dom" />
'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// import PostItem from '@/components/post/PostItem'; // No longer directly needed
import PostList from '@/components/post/PostList'; // Import PostList
import type { Post as PostType } from '@/types/post';
import type { User } from '@/lib/authUtils'; // Logged-in user type
import { Button } from '@/components/ui/Button';

// Define a more specific type for the user whose profile is being displayed
interface ProfileDisplayUser {
  id: string;
  username: string;
  // Add other public fields like createdAt if needed, e.g., joined: string;
}

interface UserProfileClientProps {
  profileUser: ProfileDisplayUser;
  initialPosts: PostType[];
  initialPagination: any; // Define a proper pagination type later
  currentUser: User | null; // The currently logged-in user
}

const UserProfileClient: React.FC<UserProfileClientProps> = ({
  profileUser,
  initialPosts,
  initialPagination,
  currentUser,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostType[]>(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);

  const currentPage = Number(searchParams.get('page')) || 1;

  // Effect to update posts if initialPosts change (e.g., due to revalidation from parent)
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    setPagination(initialPagination);
  }, [initialPagination]);

  const handleVote = useCallback(async (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!currentUser) {
      router.push('/login'); // Or show a toast/modal
      return;
    }
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to vote' }));
        throw new Error(errorData.message);
      }
      // Re-fetch or update UI. For now, relying on revalidation or optimistic updates in PostItem.
      // To immediately reflect changes without full re-fetch, the API could return the updated post
      // and we could update the specific post in the `posts` state.
      // For simplicity with RSC revalidation, often we let the revalidation handle it.
      // However, a targeted state update is better for UX if revalidation is slow.
      const updatedPostFromServer = await response.json();
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === postId ? { ...p, ...updatedPostFromServer.post } : p)
      );

    } catch (error) {
      console.error('Error voting:', error);
      alert((error as Error).message || 'Could not submit vote.');
    }
  }, [currentUser, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/user/${profileUser.username}?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">{profileUser.username}</h1>
      {/* TODO: Add more user profile details here, e.g., join date, karma, etc. */}
      <p className="text-muted-foreground mb-6">Posts by {profileUser.username}:</p>

      {/* PostList handles the empty state internally */}
      <PostList 
        posts={posts} 
        onVote={handleVote} 
        user={currentUser} 
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            variant="outline"
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfileClient; 
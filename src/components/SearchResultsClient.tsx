/// <reference lib="dom" />
'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PostList from '@/components/post/PostList';
import type { Post as PostType } from '@/types/post';
import type { User } from '@/lib/authUtils';
import { Button } from '@/components/ui/Button';

interface SearchResultsClientProps {
  initialPosts: PostType[];
  initialPagination: any; // Define a proper pagination type later
  currentUser: User | null;
  query: string;
}

const SearchResultsClient: React.FC<SearchResultsClientProps> = ({
  initialPosts,
  initialPagination,
  currentUser,
  query,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams(); // To get current sort, and for pagination
  const [posts, setPosts] = useState<PostType[]>(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);
  // const [isLoading, setIsLoading] = useState(false); // Might be needed for client-side fetching/filtering

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentSort = searchParams.get('sort') || 'new'; // Preserve sort during pagination

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    setPagination(initialPagination);
  }, [initialPagination]);

  const handleVote = useCallback(async (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!currentUser) {
      router.push('/login');
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
    // query and sort are already in searchParams and will be preserved
    router.push(`/search?${params.toString()}`);
  };

  if (!query && posts.length === 0) {
    // This case is handled by the server component (SearchPage) now.
    // Client component receives an empty query prop if no search was made.
    return null; // Or a different placeholder if SearchPage doesn't render it for empty query.
  }

  return (
    <div className="mt-8">
      {query && posts.length > 0 && (
        <h2 className="text-xl font-semibold mb-6">Results for: <span className="text-primary">{query}</span></h2>
      )}
      {query && posts.length === 0 && (
         <p className="text-center text-muted-foreground py-8">No results found for &quot;{query}&quot;.</p>
      )}

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

export default SearchResultsClient; 
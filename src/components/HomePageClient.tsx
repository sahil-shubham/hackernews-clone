'use client';

import { useAuthStore, type User } from "@/hooks/useAuthStore";
import { Post } from "@/types/post";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PostList from "./post/PostList";
import { Button } from "@/components/ui/Button";

interface HomePageClientProps {
  initialPosts: Post[];
  initialPagination: {
    page: number;
    totalPages: number;
    totalPosts: number;
  };
  initialError: string | null;
  initialUser: User | null; // This prop is still passed from page.tsx but not actively used for store sync here
}

export default function HomePageClient({
  initialPosts,
  initialPagination,
  initialError,
}: HomePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore(); // Removed setAuthUser, store is initialized globally

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(initialError);
  const [pagination, setPagination] = useState(initialPagination);

  const pageFromUrl = Number(searchParams.get('page') || '1');
  const sortFromUrl = searchParams.get('sort') || 'new';
  const searchQueryFromUrl = searchParams.get('search') || '';

  useEffect(() => {
    setPosts(initialPosts);
    setPagination(initialPagination);
    setError(initialError);
  }, [initialPosts, initialPagination, initialError]);

  const handleVote = async (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !user.token) {
      console.error('User not logged in or token missing for voting');
      setError('Please log in to vote.');
      return;
    } 
    
    const originalPosts = [...posts];
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          let newPoints = p.points;
          let newVoteType = p.voteType as 'UPVOTE' | 'DOWNVOTE' | null;

          if (p.voteType === voteType) {
            newPoints = voteType === 'UPVOTE' ? newPoints -1 : newPoints +1;
            newVoteType = null;
          } else { 
            if (p.voteType === 'UPVOTE') newPoints -=1;
            else if (p.voteType === 'DOWNVOTE') newPoints +=1;
            newPoints = voteType === 'UPVOTE' ? newPoints +1 : newPoints -1;
            newVoteType = voteType;
          }
          return {
            ...p,
            points: newPoints,
            voteType: newVoteType,
          };
        }
        return p;
      })
    );

    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ voteType }),
      });
      
      if (!response.ok) {
        setPosts(originalPosts); 
        const errorData = await response.json().catch(() => ({ message: 'Failed to vote on post' }));
        throw new Error(errorData.message || 'Failed to vote on post');
      }
      
      const updatedPostData = await response.json();
      setPosts(prevPosts => 
        prevPosts.map(p => (p.id === postId ? { ...p, ...updatedPostData.post } : p))
      );

    } catch (err: any) {
      console.error('Error voting on post:', err);
      setError(err.message || 'Could not submit vote. Please try again.');
      setPosts(originalPosts);
    }
  };

  const goToPage = (pageNum: number) => {
    const currentParams = new URLSearchParams(); 
    currentParams.set('page', pageNum.toString());
    if (sortFromUrl) currentParams.set('sort', sortFromUrl);
    if (searchQueryFromUrl) currentParams.set('search', searchQueryFromUrl);
    
    router.push(`/?${currentParams.toString()}`);
  };

  if (initialError && initialPosts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-lg max-w-4xl">
        <div role="alert" className="bg-destructive/10 border border-destructive text-destructive p-md rounded-md mb-lg">
          {initialError}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-lg max-w-5xl">
      {error && !initialError &&
        <div role="alert" className="bg-destructive/10 border border-destructive text-destructive p-md rounded-md mb-lg">
          {error}
        </div>
      }
      
      <PostList posts={posts} onVote={handleVote} /> 
      
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center py-lg">
          <div className="flex gap-sm">
            {pagination.page > 1 && (
              <Button variant="outline" onClick={() => goToPage(pagination.page - 1)}>
                Load Previous
              </Button>
            )}
            {pagination.page < pagination.totalPages && (
              <Button variant="outline" onClick={() => goToPage(pagination.page + 1)}>
                Load More
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
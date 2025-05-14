'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PostList from '@/components/post/PostList';
import { Post } from '@/components/post/PostItem';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalPosts: 0,
  });

  // Get current query parameters
  const page = Number(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'new';

  // Fetch posts when query parameters change
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          sort,
        });
        
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/posts?${queryParams.toString()}`, {
          headers,
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        setPosts(data.posts);
        setPagination({
          page: data.page,
          totalPages: data.totalPages,
          totalPosts: data.totalPosts,
        });
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [page, sort, token]);

  // Handle post voting
  const handleVote = async (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteType }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to vote on post');
      }
      
      // Update post in the UI
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            // If user already voted with the same vote type, we're removing the vote
            const voteDelta = (post.voteType === voteType) ? -1 : (post.voteType ? 0 : 1);
            return {
              ...post,
              points: post.voteType === voteType ? post.points - 1 : post.points + 1,
              voteType: post.voteType === voteType ? null : voteType,
              hasVoted: post.voteType !== voteType,
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error voting on post:', err);
    }
  };

  // Change sort type
  const handleSortChange = (newSort: string) => {
    router.push(`/?sort=${newSort}`);
  };

  // Pagination navigation
  const goToPage = (pageNum: number) => {
    router.push(`/?page=${pageNum}&sort=${sort}`);
  };

  return (
    <div className="container mx-auto px-4">
      {/* Sorting tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${sort === 'new' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleSortChange('new')}
        >
          New
        </button>
        <button
          className={`px-4 py-2 font-medium ${sort === 'top' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleSortChange('top')}
        >
          Top
        </button>
        <button
          className={`px-4 py-2 font-medium ${sort === 'best' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleSortChange('best')}
        >
          Best
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Post list */}
      <PostList posts={posts} loading={loading} onVote={handleVote} />
      
      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center py-4">
          <div className="flex space-x-2">
            {page > 1 && (
              <button
                onClick={() => goToPage(page - 1)}
                className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // Calculate page numbers to show (show 5 pages max)
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-1 border rounded text-sm ${
                    pageNum === page
                      ? 'bg-orange-600 text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {page < pagination.totalPages && (
              <button
                onClick={() => goToPage(page + 1)}
                className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

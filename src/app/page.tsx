'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PostList from '@/components/post/PostList';
import { Post } from '@/components/post/PostItem';
import { useAuth } from '@/hooks/useAuth';
import styled from 'styled-components';
import { PageContainer } from '@/styles/StyledComponents';

// Styled components for this page
const SortingTabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.colors.secondaryLight};
  margin-bottom: ${props => props.theme.space.lg};
`;

const SortTab = styled.button<{ active: boolean }>`
  padding: ${props => `${props.theme.space.md} ${props.theme.space.lg}`};
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.secondary};
  border-bottom: ${props => props.active ? `2px solid ${props.theme.colors.primary}` : 'none'};
  
  &:hover {
    color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.secondaryDark};
  }
`;

const ErrorAlert = styled.div`
  background-color: #fee2e2;
  border: 1px solid ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.space.md};
  border-radius: ${props => props.theme.radii.md};
  margin-bottom: ${props => props.theme.space.lg};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: ${props => props.theme.space.lg} 0;
`;

const PageButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: ${props => `${props.theme.space.xs} ${props.theme.space.md}`};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.radii.sm};
  font-size: ${props => props.theme.fontSizes.sm};
  background-color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.white};
  color: ${props => props.active ? props.theme.colors.white : 'inherit'};
  
  &:hover {
    background-color: ${props => props.active ? props.theme.colors.primary : '#f9fafb'};
  }
`;

function Home() {
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
          limit: '30',
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
    <PageContainer>
      {/* Sorting tabs */}
      <SortingTabs>
        <SortTab
          active={sort === 'new'}
          onClick={() => handleSortChange('new')}
        >
          New
        </SortTab>
        <SortTab
          active={sort === 'top'}
          onClick={() => handleSortChange('top')}
        >
          Top
        </SortTab>
        <SortTab
          active={sort === 'best'}
          onClick={() => handleSortChange('best')}
        >
          Best
        </SortTab>
      </SortingTabs>
      
      {/* Error message */}
      {error && <ErrorAlert>{error}</ErrorAlert>}
      
      {/* Post list */}
      <PostList posts={posts} loading={loading} onVote={handleVote} />
      
      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <PaginationContainer>
          <PageButtons>
            {page > 1 && (
              <PageButton onClick={() => goToPage(page - 1)}>
                Previous
              </PageButton>
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
                <PageButton
                  key={i}
                  active={pageNum === page}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </PageButton>
              );
            })}
            
            {page < pagination.totalPages && (
              <PageButton onClick={() => goToPage(page + 1)}>
                Next
              </PageButton>
            )}
          </PageButtons>
        </PaginationContainer>
      )}
    </PageContainer>
  );
}

export default function HomeWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}
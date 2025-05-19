'use client';

import { User } from '@/lib/authUtils'; // Added
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
  initialUser: User | null; 
}

export default function HomePageClient({
  initialPosts,
  initialPagination,
  initialError,
  initialUser, 
}: HomePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(initialError);
  const [pagination, setPagination] = useState(initialPagination);

  const sortFromUrl = searchParams.get('sort') || 'new';
  const searchQueryFromUrl = searchParams.get('search') || '';

  useEffect(() => {
    setPosts(initialPosts);
    setPagination(initialPagination);
    setError(initialError);
  }, [initialPosts, initialPagination, initialError]);


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
      
      <PostList posts={posts} user={initialUser} /> 
      
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
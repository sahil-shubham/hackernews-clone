import { Suspense } from 'react';
import { cookies } from 'next/headers';
import HomePageClient from '@/components/HomePageClient';
import type { Post } from '@/types/post'; // Ensure Post type is available
import type { User } from '@/hooks/useAuthStore'; // Ensure User type is available

// Helper function to get user from cookies (replace with your actual auth logic)
async function getServerSideUser(): Promise<User | null> {
  const cookieStore = await cookies(); // Remove await, cookies() is sync here
  const tokenCookie = cookieStore.get('authToken');

  if (tokenCookie?.value) {
    try {
      // SIMULATED: Replace with actual token verification and user data retrieval
      return {
        id: 'server-user-id',
        username: 'ServerUser',
        email: 'server@example.com',
        token: tokenCookie.value,
      };
    } catch (error) {
      console.error("Error processing token:", error);
      return null;
    }
  }
  return null;
}

async function fetchPostsData(page: number, sort: string, searchQuery: string, userToken: string | null) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    sort,
    limit: '30',
  });
  if (searchQuery) queryParams.set('search', searchQuery);

  const headers: HeadersInit = {};
  if (userToken) headers.Authorization = `Bearer ${userToken}`;
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'; 
  const fetchUrl = `${apiBaseUrl}/api/posts?${queryParams.toString()}`;

  try {
    const response = await fetch(fetchUrl, { headers, cache: 'no-store' });
    if (!response.ok) {
      const errorBody = await response.text(); 
      console.error(`API Error (${response.status}) fetching posts from ${fetchUrl}: ${errorBody}`);
      try {
        const errorJson = JSON.parse(errorBody);
        throw new Error(errorJson.message || `API error: ${response.status}`);
      } catch (e) {
        throw new Error(`API error: ${response.status} - ${errorBody}`);
      }
    }
    return response.json();
  } catch (error: any) {
    console.error(`Network/Fetch Error for ${fetchUrl}:`, error);
    throw new Error(error.message || "Failed to fetch posts due to network or parsing issue.");
  }
}

interface PageProps {
  searchParams?: { page?: string; sort?: string; search?: string; };
}

// This is the main Server Component for the page
export default async function Page({ searchParams }: PageProps) {
  const page = Number(searchParams?.page || '1');
  const sort = searchParams?.sort || 'new';
  const searchQuery = searchParams?.search || '';

  const initialUser = await getServerSideUser();

  let initialPosts: Post[] = [];
  let initialPagination = { page: 1, totalPages: 1, totalPosts: 0 };
  let initialError: string | null = null;

  try {
    const data = await fetchPostsData(page, sort, searchQuery, initialUser?.token || null);
    initialPosts = data.posts;
    initialPagination = { page: data.page, totalPages: data.totalPages, totalPosts: data.totalPosts };
  } catch (err: any) {
    console.error('Page level error fetching posts:', err);
    initialError = err.message || 'Failed to load posts.';
    initialPosts = [];
  }

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-lg max-w-4xl">Loading...</div>}> 
      <HomePageClient
        initialPosts={initialPosts}
        initialPagination={initialPagination}
        initialError={initialError}
        initialUser={initialUser}
      />
    </Suspense>
  );
}
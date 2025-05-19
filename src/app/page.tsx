import { Suspense } from 'react';
// import { cookies } from 'next/headers'; // No longer needed here directly
import HomePageClient from '@/components/HomePageClient';
import type { Post } from '@/types/post'; // Ensure Post type is available
// import type { User } from '@/hooks/useAuthStore'; // User type will come via getServerSideUser
import { getServerSideUser } from '@/lib/authUtils'; // Import the new utility

// // Helper function to get user from cookies (replace with your actual auth logic)
// async function getServerSideUser(): Promise<User | null> { // REMOVE THIS LOCAL DEFINITION
//   const cookieStore = await cookies(); 
//   const tokenCookie = cookieStore.get('authToken');
// 
//   if (tokenCookie?.value) {
//     try {
//       // SIMULATED: Replace with actual token verification and user data retrieval
//       return {
//         id: 'server-user-id',
//         username: 'ServerUser',
//         email: 'server@example.com',
//         token: tokenCookie.value,
//       };
//     } catch (error) {
//       console.error("Error processing token:", error);
//       return null;
//     }
//   }
//   return null;
// }

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
  // searchParams is now a Promise that resolves to the search parameters object
  searchParams: Promise<{ [key: string]: string | string[] | undefined } | undefined>;
}

// This is the main Server Component for the page
export default async function Page({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;

  // Handle single or array values for params, taking the first if it's an array
  const pageParam = searchParams?.page;
  const sortParam = searchParams?.sort;
  const searchParam = searchParams?.search;

  const page = Number((Array.isArray(pageParam) ? pageParam[0] : pageParam) || '1');
  const sort = (Array.isArray(sortParam) ? sortParam[0] : sortParam) || 'new';
  const searchQuery = (Array.isArray(searchParam) ? searchParam[0] : searchParam) || '';

  const initialUser = await getServerSideUser(); // Uses the imported version

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
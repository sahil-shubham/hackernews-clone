import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import PostDetailPageClient from '@/components/post/PostDetailPageClient'
import { getServerSideUser } from '@/lib/authUtils'
import type { Post as PostType } from '@/types/post'
import type { Comment as CommentType } from '@/types/comment'
import { PageContainer } from '@/components/ui/layout'

const LoadingSkeleton = () => (
  <PageContainer className="py-8">
    <div className="animate-pulse bg-card p-6 rounded-lg shadow border border-border">
      <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-muted rounded w-full mb-2"></div>
      <div className="h-4 bg-muted rounded w-full mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/4"></div>
    </div>
    <div className="animate-pulse bg-card p-6 rounded-lg shadow mt-8 border border-border">
      <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
      <div className="h-10 bg-muted rounded w-full mb-4"></div>
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="p-4 border border-border rounded-md">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  </PageContainer>
)

async function fetchPostDetails(postId: string, userToken: string | null): Promise<PostType | null> {
  const headers: HeadersInit = {}
  // The middleware handles cookie-based auth for API routes,
  // but if calling an external API that needs a Bearer token, it would be added here.
  // For internal API calls, cookies are forwarded by default by Next.js fetch running on server.
  // If we want to explicitly pass the user's cookie for internal API that relies on it (not x-user-id):
  // const cookieStore = cookies()
  // const authToken = cookieStore.get('auth-token')
  // if (authToken) headers.Cookie = `auth-token=${authToken.value}`

  // However, our API routes (e.g., GET /api/posts/:id) use x-user-id from middleware
  // which is derived from the cookie, so explicit token/cookie passing in fetch header might not be needed
  // if the API route is configured correctly to read `x-user-id`.
  // Let's assume for now the API route can get user context if needed via middleware + x-user-id.

  try {
    const response = await fetch(`/api/posts/${postId}`, { 
      headers, 
      cache: 'no-store' // Or specific caching strategy
    })
    if (response.status === 404) return null
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`API Error (${response.status}) fetching post ${postId}: ${errorBody}`)
      throw new Error(`Failed to fetch post details: ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error(`Network/Fetch Error for post ${postId}:`, error)
    throw error // Rethrow to be caught by page
  }
}

async function fetchPostComments(postId: string, userToken: string | null): Promise<CommentType[]> {
  const headers: HeadersInit = {}
  // Similar consideration for headers as in fetchPostDetails

  try {
    const response = await fetch(`/api/posts/${postId}/comments`, { 
      headers, 
      cache: 'no-store' // Or specific caching strategy
    })
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`API Error (${response.status}) fetching comments for post ${postId}: ${errorBody}`)
      throw new Error(`Failed to fetch comments: ${response.status}`)
    }
    const data = await response.json()
    return data.comments || [] // API returns { comments: [...] }
  } catch (error) {
    console.error(`Network/Fetch Error for comments on post ${postId}:`, error)
    throw error // Rethrow to be caught by page
  }
}

interface PostDetailPageProps {
  params: Promise<{ postId: string } | undefined>;
}

export default async function PostDetailPage({ params: paramsPromise }: PostDetailPageProps) {
  const params = await paramsPromise;
  if (!params) {
    notFound();
  }
  const { postId } = params;
  const currentUser = await getServerSideUser();

  // Fetch data in parallel
  const [postResult, commentsResult] = await Promise.allSettled([
    fetchPostDetails(postId, currentUser?.token || null),
    fetchPostComments(postId, currentUser?.token || null)
  ])

  const post = postResult.status === 'fulfilled' ? postResult.value : null
  // If fetching post details failed critically (not just 404), we might want to throw or show error page.
  if (postResult.status === 'rejected') {
    console.error("Failed to load post details:", postResult.reason)
    // Optionally, render an error page or throw to trigger Next.js error boundary
    // For now, if post is null, PostDetailPageClient will handle it (shows "Post not found").
  }
  
  if (!post) {
    notFound() // Triggers Next.js 404 page
  }

  const comments = commentsResult.status === 'fulfilled' ? commentsResult.value : []
  if (commentsResult.status === 'rejected') {
    console.error("Failed to load comments:", commentsResult.reason)
    // Comments failing to load might not be as critical as post failing.
    // We proceed with empty comments array and log error.
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PostDetailPageClient
        initialPost={post}
        initialComments={comments}
        currentUser={currentUser}
        postId={postId}
      />
    </Suspense>
  )
}

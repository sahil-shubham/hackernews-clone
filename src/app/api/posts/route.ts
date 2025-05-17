import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import redis from '@/lib/redis'; // Import the Redis client

const CACHE_TTL_SECONDS = 10 * 60; // 10 minutes

// Validate query parameters with Zod
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
  sort: z.enum(['new', 'top', 'best']).default('new'),
  search: z.string().nullable().optional(),
});

// Validate post creation
const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url().nullable().optional(),
  textContent: z.string().nullable().optional(),
  type: z.enum(['LINK', 'TEXT']),
}).refine(data => {
  // Ensure link posts have a URL
  if (data.type === 'LINK' && !data.url) {
    return false;
  }
  // Ensure text posts have content
  if (data.type === 'TEXT' && !data.textContent) {
    return false;
  }
  return true;
}, {
  message: "Link posts must include a URL, and text posts must include text content",
});

// Define types for Prisma response
// type PostWithRelations = Prisma.PostGetPayload<{
//   include: {
//     author: {
//       select: {
//         id: true;
//         username: true;
//       };
//     };
//     _count: {
//       select: {
//         votes: true;
//         comments: true;
//       };
//     };
//     votes: {
//       select: {
//         voteType: true;
//       };
//     };
//   };
// }>;

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      sort: url.searchParams.get('sort'),
      search: url.searchParams.get('search'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { page, limit, sort, search } = parsed.data;

    // Only cache the first page for the specified sort orders
    const canCache = page === 1 && ['new', 'top', 'best'].includes(sort) && redis;
    const cacheKey = canCache ? `posts:${sort}:page:1:limit:${limit}` : null;

    if (canCache && cacheKey) {
      try {
        const cachedData = await redis?.get(cacheKey);
        if (cachedData) {
          console.log(`Cache HIT for key: ${cacheKey}`);
          return NextResponse.json(JSON.parse(cachedData));
        }
        console.log(`Cache MISS for key: ${cacheKey}`);
      } catch (cacheError) {
        console.error(`Redis GET error for key ${cacheKey}:`, cacheError);
        // Proceed to fetch from DB if cache read fails
      }
    }

    const skip = (page - 1) * limit;

    // Get userId from header if available (set by middleware)
    const userId = request.headers.get('x-user-id');

    // Create base query
    const where: any = {};
    if (search) {
      // Prepare search term for PostgreSQL FTS: replace spaces with '&' for AND logic
      // Also, escape special FTS characters if necessary, though for simple terms this might be enough.
      // More robust parsing might involve splitting by space and joining with ' & '
      // or handling quotes for phrase searches, etc.
      const ftsSearchTerm = search.trim().split(/\s+/).join(' & ');
      
      if (ftsSearchTerm) { // Ensure the term is not empty after processing
        where.OR = [
          { title: { search: ftsSearchTerm } },
          { textContent: { search: ftsSearchTerm } },
        ];
      }
    }
    
    // Define sort order based on sort parameter
    let orderBy: any = {};
    
    switch (sort) {
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'top':
        // For simplicity, we'll do a basic score sort.
        // In a real app, you'd implement a more sophisticated algorithm
        orderBy = [
          { votes: { _count: 'desc' } },
          { createdAt: 'desc' }
        ];
        break;
      case 'best':
        // Similar to top, but could be refined further
        orderBy = [
          { votes: { _count: 'desc' } },
          { createdAt: 'desc' }
        ];
        break;
    }

    // Fetch posts with author, vote count, and comment count
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where,
        take: limit,
        skip,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
          votes: userId ? {
            where: {
              userId,
            },
            select: {
              voteType: true,
            },
          } : false,
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Transform posts to include the calculated fields
    const transformedPosts = posts.map((post: any) => {
      const userVote = post.votes && post.votes.length > 0 ? post.votes[0] : null;
      
      return {
        id: post.id,
        title: post.title,
        url: post.url,
        textContent: post.textContent,
        type: post.type,
        author: post.author,
        points: post._count.votes, // In a real app, you'd count upvotes - downvotes
        commentCount: post._count.comments,
        createdAt: post.createdAt,
        voteType: userVote?.voteType || null,
        hasVoted: Boolean(userVote),
      };
    });

    // Calculate pagination information
    const totalPages = Math.ceil(totalPosts / limit);

    const responsePayload = {
      posts: transformedPosts,
      page,
      limit,
      totalPages,
      totalPosts,
    };

    if (canCache && cacheKey) {
      try {
        await redis?.set(cacheKey, JSON.stringify(responsePayload), 'EX', CACHE_TTL_SECONDS);
        console.log(`Cache SET for key: ${cacheKey}`);
      } catch (cacheError) {
        console.error(`Redis SET error for key ${cacheKey}:`, cacheError);
        // If cache write fails, we still return the data from DB
      }
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const result = createPostSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { title, url, textContent, type } = result.data;
    
    const post = await prisma.post.create({
      data: {
        title,
        url,
        textContent,
        type,
        author: {
          connect: { id: userId },
        },
      },
    });

    // Invalidate relevant caches when a new post is created
    if (redis) {
      const cacheKeysToInvalidate = [
        `posts:new:page:1:limit:30`, // Assuming default limit is 30
        // Add other relevant keys, e.g., if the new post immediately affects 'top' or 'best' (though less likely for a brand new post)
      ];
      // More sophisticated: could also try to update the cache if it's simple enough, but invalidation is safer.
      // Consider also invalidating for different limit parameters if you cache those.
      // For now, we only cache page 1 with the default limit for new/top/best.
      // So, if limit changes, it won't hit this specific cache key anyway.

      // It might be safer to invalidate all primary list caches for simplicity in a take-home:
      // const cacheKeysToInvalidate = [
      //  `posts:new:page:1:limit:30`,
      //  `posts:top:page:1:limit:30`,
      //  `posts:best:page:1:limit:30`,
      // ];
      // This depends on how much precision you need vs. simplicity.
      // For a take-home, clearing the `new` posts first page is a good start.

      try {
        for (const key of cacheKeysToInvalidate) {
          await redis.del(key);
          console.log(`Cache INVALIDATED for key: ${key} due to new post`);
        }
      } catch (cacheError) {
        console.error('Redis DEL error during post creation:', cacheError);
      }
    }
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { z } from 'zod';

const AUTH_TOKEN_COOKIE_NAME = 'auth-token';

// Paths that require authentication for certain methods (e.g., POST, PUT, DELETE)
// GET requests to these might be public or conditionally public.
const potentiallyProtectedPaths = [
  { pathPattern: '/api/posts/:path*/comments', methods: ['POST', 'PUT', 'DELETE'] }, 
  { pathPattern: '/api/posts/:path*/vote', methods: ['POST'] }, 
  { pathPattern: '/api/comments', methods: ['POST', 'PUT', 'DELETE'] }, // For general comment routes
  { pathPattern: '/api/notifications', methods: ['GET','POST', 'PUT', 'DELETE'] }, // Notifications are usually private
  { pathPattern: '/api/posts', methods: ['POST', 'PUT', 'DELETE'] }, // Creating/modifying posts
  { pathPattern: '/api/submit', methods: ['POST'] }, // If /api/submit is used
];

export const jwtPayloadSchema = z.object({
  userId: z.string(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

// Helper to check if a path matches a pattern (e.g., /api/posts/:id/comments)
function pathMatches(path: string, pattern: string): boolean {
  const regex = new RegExp(`^${pattern.replace(/:[^\/]+/g, '[^\/]+')}$`);
  return regex.test(path);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Try to get user ID from token for all API routes, but don't block unless necessary
  let userIdFromToken: string | null = null;
  const tokenCookie = request.cookies.get(AUTH_TOKEN_COOKIE_NAME);

  if (tokenCookie?.value) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined for middleware');
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(tokenCookie.value, secretKey);
      const result = jwtPayloadSchema.safeParse(payload);
      if (result.success) {
        userIdFromToken = result.data.userId;
      }
    } catch (error) {
      // Token invalid or expired, proceed without user_id
      // console.warn('Middleware: Invalid token, proceeding without user_id', path, error);
    }
  }

  // Check if the current path and method require authentication
  let requiresAuth = false;
  for (const p of potentiallyProtectedPaths) {
    if (pathMatches(path, p.pathPattern) && p.methods.includes(method)) {
      requiresAuth = true;
      break;
    }
  }

  // If authentication is required and no valid user ID was found from token
  if (requiresAuth && !userIdFromToken) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid authentication token' },
      { status: 401 }
    );
  }

  // Add x-user-id to request headers if a user was identified
  const requestHeaders = new Headers(request.headers);
  if (userIdFromToken) {
    requestHeaders.set('x-user-id', userIdFromToken);
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/:path*', // General matcher, specific logic handled inside
  ],
}; 
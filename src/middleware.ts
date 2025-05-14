import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const authPaths = [
  '/api/posts',
  '/api/comments',
  '/api/auth/me',
];

export const jwtPayloadSchema = z.object({
  userId: z.string(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Only run this middleware for protected API routes
  if (!authPaths.some(authPath => path.startsWith(authPath))) {
    return NextResponse.next();
  }
  
  // Skip authentication for GET requests to posts
  if (path.startsWith('/api/posts') && request.method === 'GET') {
    return NextResponse.next();
  }
  
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid token' },
      { status: 401 }
    );
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = jwtPayloadSchema.safeParse(decoded);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token payload' },
        { status: 401 }
      );
    }
    
    // Add user info to request headers for API routes to use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', result.data.userId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}; 
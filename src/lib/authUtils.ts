import { cookies } from 'next/headers';
import { verifyJwtToken, type JwtPayload } from './jwt'; // Assuming jwt.ts is in the same lib directory
import { prisma } from './prisma'; // Assuming prisma.ts is in the same lib directory
import type { User } from '@/hooks/useAuthStore';

// Name of the cookie storing the authentication token
const AUTH_TOKEN_COOKIE_NAME = 'auth-token';

export async function getServerSideUser(): Promise<User | null> {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get(AUTH_TOKEN_COOKIE_NAME);

  if (tokenCookie?.value) {
    const token = tokenCookie.value;
    try {
      const decodedPayload = await verifyJwtToken(token);

      if (decodedPayload && decodedPayload.userId) {
        const userFromDb = await prisma.user.findUnique({
          where: { id: decodedPayload.userId },
          select: { id: true, username: true, email: true },
        });

        if (userFromDb) {
          return {
            ...userFromDb,
            token: token, // Include the token itself if needed by the client store
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error processing token in getServerSideUser:', error);
      return null;
    }
  }
  return null;
}

/**
 * Utility function to set the auth token cookie.
 * To be used in API routes like login/signup.
 */
export function setAuthCookie(token: string, maxAgeSeconds: number = 60 * 60 * 24 * 7 /* 7 days */) {
  const cookieStore = cookies();
  cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
    path: '/',
    sameSite: 'lax', // Or 'strict' depending on your needs
  });
}

/**
 * Utility function to clear the auth token cookie.
 * To be used in API routes like logout.
 */
export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
}
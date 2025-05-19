import { cookies } from 'next/headers';
import { verifyJwtToken, type JwtPayload } from './jwt'; // Assuming jwt.ts is in the same lib directory
import { prisma } from './prisma'; // Assuming prisma.ts is in the same lib directory
import { Author } from '@/types/comment';

export interface User extends Author {
  email: string;
  token: string | null; // Token will be managed by httpOnly cookie primarily
}

// Name of the cookie storing the authentication token
const AUTH_TOKEN_COOKIE_NAME = 'auth-token';

export async function getServerSideUser(): Promise<User | null> {
  console.log('[getServerSideUser] Called at:', new Date().toISOString());
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(AUTH_TOKEN_COOKIE_NAME);
  
  if (tokenCookie) {
    console.log(`[getServerSideUser] Cookie '${AUTH_TOKEN_COOKIE_NAME}' found:`, {
      name: tokenCookie.name,
      valuePresent: !!tokenCookie.value,
      valueLength: tokenCookie.value?.length
    });
  } else {
    console.log(`[getServerSideUser] Cookie '${AUTH_TOKEN_COOKIE_NAME}' not found.`);
  }

  if (tokenCookie?.value) {
    const token = tokenCookie.value;
    console.log('[getServerSideUser] Token value from cookie:', token.substring(0, 20) + '...'); // Log a snippet
    try {
      const decodedPayload = await verifyJwtToken(token);
      console.log('[getServerSideUser] Decoded JWT payload:', decodedPayload);

      if (decodedPayload && decodedPayload.userId) {
        const userFromDb = await prisma.user.findUnique({
          where: { id: decodedPayload.userId },
          select: { id: true, username: true, email: true },
        });
        console.log('[getServerSideUser] User from DB:', userFromDb ? { id: userFromDb.id, username: userFromDb.username } : null);

        if (userFromDb) {
          return {
            ...userFromDb,
            token: token, // Include the token itself if needed by the client store
          };
        }
      }
      console.log('[getServerSideUser] Returning null (payload or DB user issue).');
      return null;
    } catch (error) {
      console.error('[getServerSideUser] Error processing token:', error);
      return null;
    }
  }
  console.log('[getServerSideUser] Returning null (no token cookie).');
  return null;
}

/**
 * Utility function to set the auth token cookie.
 * To be used in API routes like login/signup.
 */
export async function setAuthCookie(token: string, maxAgeSeconds: number = 60 * 60 * 24 * 7 /* 7 days */) {
  const cookieStore = await cookies();
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
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
}
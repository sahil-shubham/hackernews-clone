import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export interface JwtPayload {
  userId: string;
}

export async function signJwtToken(payload: JwtPayload): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  
  // Default expiration to 7 days if not specified
  const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secretKey);
}

export async function verifyJwtToken(token: string): Promise<JwtPayload | null> {
  if (!JWT_SECRET) {
    return null;
  }
  
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Check if payload has the required userId property
    if (typeof payload === 'object' && payload !== null && 'userId' in payload) {
      return {
        userId: payload.userId as string
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function extractJwtToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
} 
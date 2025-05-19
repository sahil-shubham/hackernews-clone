import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { prisma } from '@/lib/prisma';
import { setAuthCookie } from '@/lib/authUtils';

const loginSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { emailOrUsername, password } = result.data;
    
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    
    // Convert expiration to seconds
    let expirationTime = 7 * 24 * 60 * 60; // Default 7 days in seconds
    if (JWT_EXPIRES_IN) {
      const match = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
          case 'd': expirationTime = value * 24 * 60 * 60; break;
          case 'h': expirationTime = value * 60 * 60; break;
          case 'm': expirationTime = value * 60; break;
          case 's': expirationTime = value; break;
        }
      }
    }
    
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expirationTime)
      .sign(secretKey);
    
    // Set the httpOnly cookie
    setAuthCookie(token, expirationTime);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
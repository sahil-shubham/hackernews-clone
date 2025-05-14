import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, username, password } = result.data;
    
    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    
    // Use as any to work around type issues with jsonwebtoken
    const token = jwt.sign(
      { userId: user.id } as any, 
      JWT_SECRET as jwt.Secret, 
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
    
    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/authUtils';

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error during logout' }, { status: 500 });
  }
} 
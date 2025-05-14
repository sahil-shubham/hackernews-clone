'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-orange-600 text-white p-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="font-bold text-lg">
            Hacker News Clone
          </Link>
          <Link href="/newest" className="hover:underline">
            new
          </Link>
          <Link href="/submit" className="hover:underline">
            submit
          </Link>
        </div>
        
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span>{user.username}</span>
              <button 
                onClick={logout}
                className="hover:underline"
              >
                logout
              </button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link href="/login" className="hover:underline">
                login
              </Link>
              <Link href="/signup" className="hover:underline">
                signup
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}; 
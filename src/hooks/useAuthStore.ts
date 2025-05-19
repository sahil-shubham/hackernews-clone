'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Author } from '@/types/comment';

export interface User extends Author {
  email: string;
  token: string | null;
}

export interface AuthStoreState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }), // Persist only token and user
    }
  )
);

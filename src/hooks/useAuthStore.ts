'use client';

import { create } from 'zustand';
import type { Author } from '@/types/comment';

export interface User extends Author {
  email: string;
  token: string | null; // Token will be managed by httpOnly cookie primarily
}

export interface AuthStoreState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStoreState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

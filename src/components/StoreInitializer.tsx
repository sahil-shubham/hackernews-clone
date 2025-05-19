'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, type User } from '@/hooks/useAuthStore';

interface StoreInitializerProps {
  serverUser: User | null;
}

function StoreInitializer({ serverUser }: StoreInitializerProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Initialize the store only once and if there's serverUser data
    // and the store hasn't been initialized from the server yet or if the serverUser differs from current user.
    // This handles cases where the client might already have a user (e.g., from a previous session if persist was on),
    // but we want the server's version to take precedence on load.
    if (!initialized.current) {
      const currentStoreUser = useAuthStore.getState().user;
      // Only set if serverUser is defined and different or if client user is null
      if (serverUser || (!serverUser && currentStoreUser)) { 
        if (JSON.stringify(serverUser) !== JSON.stringify(currentStoreUser)) {
            useAuthStore.setState({ user: serverUser });
        }
      }
      initialized.current = true;
    }
  }, [serverUser]); // Rerun if serverUser changes (though it shouldn't post-initial load)

  return null; // This component doesn't render anything
}

export default StoreInitializer; 
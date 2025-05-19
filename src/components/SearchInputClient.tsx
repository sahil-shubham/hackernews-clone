'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { XIcon } from 'lucide-react';

interface SearchInputClientProps {
  initialQuery?: string;
}

const SearchInputClient: React.FC<SearchInputClientProps> = ({ initialQuery = '' }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update searchTerm if the query in URL changes (e.g., browser back/forward)
    setSearchTerm(searchParams.get('query') || '');
  }, [searchParams]);

  useEffect(() => {
    // Focus input if it's present and there was no initial query from URL (fresh page load to /search)
    if (searchInputRef.current && !initialQuery && !(searchParams.get('query'))) {
      searchInputRef.current.focus();
    }
  }, [initialQuery, searchParams]);

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    const currentParams = new URLSearchParams(Array.from(searchParams.entries())); // Preserve other params like sort

    if (trimmedSearchTerm) {
      currentParams.set('query', trimmedSearchTerm);
      currentParams.set('page', '1'); // Reset to page 1 for new search
    } else {
      currentParams.delete('query');
      // Optionally, you might want to remove other search-specific params or reset to a default view
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    currentParams.delete('query');
    // currentParams.set('page', '1'); // Reset page if desired when clearing
    router.push(`/search?${currentParams.toString()}`);
    searchInputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSearchSubmit} className="mb-8">
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search stories..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="mt-1 block w-full px-4 py-3 bg-background border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-base pr-12 h-14 text-lg"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClearSearch}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10"
          >
            <XIcon className="h-6 w-6 text-muted-foreground" />
          </Button>
        )}
      </div>
    </form>
  );
};

export default SearchInputClient; 
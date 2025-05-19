"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/layout";
import { XIcon } from "lucide-react";

const SearchResults = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const page = searchParams.get("page") || "1";
  const sort = searchParams.get("sort") || "new";

  if (!query) {
    return <p className="text-center text-muted-foreground py-8">Enter a search term to see results.</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Results for: <span className="text-primary">{query}</span></h2>
      
      <div className="border border-dashed border-border rounded-md p-8 text-center text-muted-foreground">
        <p>Search results would appear here.</p>
        <p className="text-xs mt-2">(Implement fetching and display using e.g. PostList)</p>
      </div>
    </div>
  );
};

const SearchPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(searchParams.get("query") || "");
  }, [searchParams]);

  useEffect(() => {
    if (searchInputRef.current && !initialQuery) {
      searchInputRef.current.focus();
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

    if (trimmedSearchTerm) {
      currentParams.set("query", trimmedSearchTerm);
      currentParams.set("page", "1");
    } else {
      currentParams.delete("query");
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    currentParams.delete("query");
    currentParams.set("page", "1"); 
    router.push(`/search?${currentParams.toString()}`);
    searchInputRef.current?.focus();
  };

  return (
    <PageContainer className="py-6 sm:py-8">
      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search stories by title, URL, or author..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-base pr-10 sm:pr-12 h-12 sm:h-14 text-lg"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10"
            >
              <XIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </Button>
          )}
        </div>
      </form>
      
      <Suspense fallback={<div className="text-center py-10">Loading search results...</div>}>
        <SearchResults />
      </Suspense>
    </PageContainer>
  );
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading page...</div>}>
      <SearchPageClient />
    </Suspense>
  );
} 
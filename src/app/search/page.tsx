"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as Styled from "@/styles/components";

const SearchResults = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const page = searchParams.get("page") || "1";
  const sort = searchParams.get("sort") || "new"; // Or some default sort for search

  // TODO: Fetch search results based on query, page, sort, etc.
  // This will be similar to src/app/page.tsx's useEffect for fetching posts

  if (!query) {
    return <p>Enter a search term to begin.</p>;
  }

  return (
    <div>
      <h2>Results for {query}</h2>
      <p>Page: {page}, Sort by: {sort}</p>
      {/* Placeholder for results list */}
      <div>
        {/* Map over search results and render them */}
        <p>Search results will appear here...</p>
        <p>Implement fetching and display of posts similar to PostList.</p>
      </div>
      {/* Placeholder for pagination */}
      <div>
        <p>Pagination will go here...</p>
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

  // Sync searchTerm state with URL's 'query' parameter
  useEffect(() => {
    const queryFromUrl = searchParams.get("query") || "";
    if (searchTerm !== queryFromUrl) {
      setSearchTerm(queryFromUrl);
    }
  }, [searchParams]);

  // Focus input on initial load if no query, or when query is cleared
  useEffect(() => {
    if (searchInputRef.current && !initialQuery) {
      searchInputRef.current.focus();
    }
  }, [initialQuery]);


  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    const currentParams = new URLSearchParams(searchParams.toString());

    if (trimmedSearchTerm) {
      currentParams.set("query", trimmedSearchTerm);
      currentParams.set("page", "1"); // Reset to page 1 for new search
      // We might want to preserve sort/filter options or reset them
      // For now, only 'query' and 'page' are explicitly managed here
    } else {
      // If search term is cleared, remove 'query' param
      currentParams.delete("query");
      // Optionally, you might want to clear other search-related params too
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchTerm(""); // Clear the input field
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("query");
    currentParams.set("page", "1"); // Reset to page 1
    router.push(`/search?${currentParams.toString()}`);
    if (searchInputRef.current) {
      searchInputRef.current.focus(); // Focus after clearing
    }
  };


  return (
    <div>
      <Styled.SearchInputContainer>
        <form onSubmit={handleSearchSubmit}>
          <Styled.StyledSearchInput
            ref={searchInputRef}
            type="text"
            placeholder="Search stories by title, url or author"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Styled.ClearSearchButton
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              &times;
            </Styled.ClearSearchButton>
          )}
          {/* We can add a submit button if desired, or rely on Enter key press */}
          {/* <button type="submit">Search</button> */}
        </form>
      </Styled.SearchInputContainer>

      {/* Tabs for "Stories", "Comments", etc. and filters for "by Popularity", "by Date" will go here */}
      {/* Sorting options like "All time", "Last 24h" etc. will also go here */}
      {/* For now, SearchResults component will read these from URL */}
      
      <Suspense fallback={<div>Loading search results...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
};

export default function SearchPage() {
  return (
    // Wrap SearchPageClient with Suspense because it uses useSearchParams
    <Suspense fallback={<div>Loading page...</div>}>
      <SearchPageClient />
    </Suspense>
  );
} 
"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import styled from "styled-components";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import NotificationBell from "@/components/notifications/NotificationBell";

// Placeholder for a search icon, replace with actual SVG or icon component
const SearchIconPlaceholder = () => (
  <svg
    data-testid="geist-icon"
    height="16"
    stroke-linejoin="round"
    viewBox="0 0 16 16"
    width="16"
    style={{ color: "currentcolor" }}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M1.5 6.5C1.5 3.73858 3.73858 1.5 6.5 1.5C9.26142 1.5 11.5 3.73858 11.5 6.5C11.5 9.26142 9.26142 11.5 6.5 11.5C3.73858 11.5 1.5 9.26142 1.5 6.5ZM6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C8.02469 13 9.42677 12.475 10.5353 11.596L13.9697 15.0303L14.5 15.5607L15.5607 14.5L15.0303 13.9697L11.596 10.5353C12.475 9.42677 13 8.02469 13 6.5C13 2.91015 10.0899 0 6.5 0Z"
      fill="currentColor"
    ></path>
  </svg>
);

const HeaderContainer = styled.header`
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.white};
  padding: ${(props) => props.theme.space.md} 0;
`;

const HeaderContent = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${(props) => props.theme.space.lg};
  height: 48px;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space.lg};
`;

const Logo = styled(Link)`
  font-weight: ${(props) => props.theme.fontWeights.bold};
  font-size: ${(props) => props.theme.fontSizes.lg};
  color: ${(props) => props.theme.colors.white};
  &:hover {
    text-decoration: none;
  }
`;

const NavLink = styled(Link)`
  color: ${(props) => props.theme.colors.white};
  font-weight: ${(props) => props.theme.fontWeights.medium};
  font-size: ${(props) => props.theme.fontSizes.sm};
  &:hover {
    color: ${(props) => props.theme.colors.primaryLight};
    text-decoration: none;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space.md};
`;

const UserText = styled.span`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.white};
  font-weight: ${(props) => props.theme.fontWeights.medium};
`;

const LogoutButton = styled.button`
  color: ${(props) => props.theme.colors.white};
  font-weight: ${(props) => props.theme.fontWeights.medium};
  font-size: ${(props) => props.theme.fontSizes.sm};
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  &:hover {
    color: ${(props) => props.theme.colors.primaryLight};
    text-decoration: none;
  }
`;

// New Styled Components for Search
const SearchToggleContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const SearchInputContainer = styled.div<{ isOpen: boolean }>`
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  align-items: center;
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.secondaryLight};
  border-radius: ${(props) => props.theme.radii.md};
  padding: ${(props) => props.theme.space.xs} ${(props) => props.theme.space.sm};
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 250px;
  box-shadow: ${(props) => props.theme.shadows.md};

  form {
    display: flex;
    width: 100%;
    align-items: center;
  }
`;

const InlineSearchInput = styled.input`
  flex-grow: 1;
  border: none;
  outline: none;
  font-size: ${(props) => props.theme.fontSizes.sm};
  padding: ${(props) => props.theme.space.xs};
  color: ${(props) => props.theme.colors.secondaryDark};
  background-color: transparent;
  margin-right: ${(props) => props.theme.space.xs};

  &::placeholder {
    color: ${(props) => props.theme.colors.secondary};
  }
`;

const ClearSearchButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => props.theme.colors.secondary};
  cursor: pointer;
  padding: ${(props) => props.theme.space.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.md};

  &:hover {
    color: ${(props) => props.theme.colors.secondaryDark};
  }
`;

// Moved and new Tab Components
const TabsBarContainer = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border-bottom: 1px solid ${(props) => props.theme.colors.secondaryLight};
  padding: 0;
`;

const SortingTabs = styled.div`
  display: flex;
  height: 48px;
  align-items: flex-end;
`;

const SortTab = styled.button<{ active: boolean }>`
  padding: ${(props) => `${props.theme.space.sm} ${props.theme.space.md}`};
  font-weight: ${(props) => props.theme.fontWeights.medium};
  color: ${(props) =>
    props.active
      ? props.theme.colors.secondaryDark
      : props.theme.colors.secondary};
  border-bottom: ${(props) =>
    props.active
      ? `2px solid ${props.theme.colors.primary}`
      : "2px solid transparent"};
  background-color: transparent;
  margin-right: ${(props) => props.theme.space.md};
  height: 100%;
  display: flex;
  align-items: center;

  &:hover {
    color: ${(props) => props.theme.colors.secondaryDark};
  }
`;

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "new";

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchToggle = () => {
    const newIsOpen = !isSearchOpen;
    setIsSearchOpen(newIsOpen);
    if (!newIsOpen && !searchTermFromUrl) {
      setSearchTerm("");
    }
  };

  const searchTermFromUrl = searchParams.get("search") || "";
  useEffect(() => {
    if (searchTerm !== searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [searchTermFromUrl, searchTerm]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set("search", trimmedSearchTerm);
      currentParams.set("page", "1");
      router.push(`/?${currentParams.toString()}`);
      // setIsSearchOpen(false); // Keep search open to see the term and clear button
    } else {
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("search");
    currentParams.set("page", "1");
    router.push(`/?${currentParams.toString()}`);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSortChange = (newSort: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("sort", newSort);
    currentParams.set("page", "1");
    router.push(`/?${currentParams.toString()}`);
  };

  return (
    <div>
      <HeaderContainer>
        <HeaderContent>
          <NavLinks>
            <Logo href="/">Hacker News</Logo>
            <NavLink href="/submit">submit</NavLink>
          </NavLinks>

          <UserSection>
            <SearchToggleContainer>
              {!isSearchOpen && (
                <div
                  onClick={handleSearchToggle}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <SearchIconPlaceholder />
                </div>
              )}
              <SearchInputContainer isOpen={isSearchOpen}>
                <form onSubmit={handleSearchSubmit}>
                  <InlineSearchInput
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (
                          !searchInputRef.current?.contains(
                            document.activeElement
                          ) &&
                          !searchTerm &&
                          !searchTermFromUrl
                        ) {
                          setIsSearchOpen(false);
                        }
                      }, 100);
                    }}
                  />
                  {searchTerm && (
                    <ClearSearchButton
                      type="button"
                      onClick={handleClearSearch}
                      aria-label="Clear search"
                    >
                      &times;
                    </ClearSearchButton>
                  )}
                </form>
              </SearchInputContainer>
            </SearchToggleContainer>

            {user ? (
              <>
                <NotificationBell />
                <UserText>{user.username}</UserText>
                <LogoutButton onClick={logout}>logout</LogoutButton>
              </>
            ) : (
              <>
                <NavLink href="/login">login</NavLink>
              </>
            )}
          </UserSection>
        </HeaderContent>
      </HeaderContainer>
      <TabsBarContainer>
        <HeaderContent>
          <SortingTabs>
            <SortTab
              active={currentSort === "new"}
              onClick={() => handleSortChange("new")}
            >
              New
            </SortTab>
            <SortTab
              active={currentSort === "top"}
              onClick={() => handleSortChange("top")}
            >
              Top
            </SortTab>
            <SortTab
              active={currentSort === "best"}
              onClick={() => handleSortChange("best")}
            >
              Best
            </SortTab>
          </SortingTabs>
        </HeaderContent>
      </TabsBarContainer>
    </div>
  );
};

export default function HeaderWrapper() {
  return (
    <Suspense>
      <Header />
    </Suspense>
  );
}

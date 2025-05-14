'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.space.md};
`;

const HeaderContent = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.space.lg};
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xl};
`;

const Logo = styled(Link)`
  font-weight: ${props => props.theme.fontWeights.bold};
  font-size: ${props => props.theme.fontSizes.lg};
`;

const NavLink = styled(Link)`
  &:hover {
    text-decoration: underline;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.lg};
`;

const LogoutButton = styled.button`
  &:hover {
    text-decoration: underline;
  }
`;

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <HeaderContainer>
      <HeaderContent>
        <NavLinks>
          <Logo href="/">
            Hacker News Clone
          </Logo>
          <NavLink href="/newest">
            new
          </NavLink>
          <NavLink href="/submit">
            submit
          </NavLink>
        </NavLinks>
        
        <UserSection>
          {user ? (
            <>
              <span>{user.username}</span>
              <LogoutButton onClick={logout}>
                logout
              </LogoutButton>
            </>
          ) : (
            <>
              <NavLink href="/login">
                login
              </NavLink>
              <NavLink href="/signup">
                signup
              </NavLink>
            </>
          )}
        </UserSection>
      </HeaderContent>
    </HeaderContainer>
  );
}; 
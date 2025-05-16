import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have this hook
import { formatDistanceToNow } from 'date-fns'; // For relative time

// Types (could be imported from a shared types file or API schema later)
interface TriggeringUser {
  id: string;
  username: string;
}
interface NotificationPost {
  id: string;
  title: string;
}
interface NotificationComment {
  id: string;
  textContent: string | null;
}
export interface ApiNotification {
  id: string;
  createdAt: string; // Date as string from API
  read: boolean;
  type: string; // e.g., NEW_COMMENT_ON_POST, REPLY_TO_COMMENT
  triggeringUser: TriggeringUser | null;
  post: NotificationPost | null;
  comment: NotificationComment | null;
}

const PopupContainer = styled.div`
  position: absolute;
  top: 60px; // Adjust as needed based on your navbar height
  right: 10px; // Adjust as needed
  width: 400px;
  max-height: 500px;
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radii.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${props => props.theme.space.lg};
  border-bottom: 1px solid ${props => props.theme.colors.secondaryLight};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: ${props => props.theme.fontSizes.lg};
  }
`;

const Tabs = styled.div`
  display: flex;
  background-color: ${props => props.theme.colors.background};
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${props => props.theme.space.md};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.secondary};
  border: none;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  background-color: transparent;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.colors.secondaryLight};
  }
`;

const NotificationList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex-grow: 1;
`;

const NotificationItemStyled = styled.li<{ read: boolean }>`
  padding: ${props => props.theme.space.md} ${props => props.theme.space.lg};
  border-bottom: 1px solid ${props => props.theme.colors.secondaryLight};
  opacity: ${props => props.read ? 0.7 : 1};
  background-color: ${props => !props.read ? props.theme.colors.primaryLight : props.theme.colors.white };
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.colors.secondaryLight};
  }

  p {
    margin: 0 0 ${props => props.theme.space.xs} 0;
    font-size: ${props => props.theme.fontSizes.md};
  }

  small {
    font-size: ${props => props.theme.fontSizes.sm};
    color: ${props => props.theme.colors.secondary};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.space.xl};
  text-align: center;
  color: ${props => props.theme.colors.secondary};
  height: 100%;

  svg {
    width: 50px;
    height: 50px;
    margin-bottom: ${props => props.theme.space.md};
    fill: ${props => props.theme.colors.secondaryLight};
  }
`;

const Footer = styled.div`
  padding: ${props => props.theme.space.md} ${props => props.theme.space.lg};
  border-top: 1px solid ${props => props.theme.colors.secondaryLight};
  text-align: center;
`;

const MarkAllReadButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.colors.primary};
  border: none;
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  font-size: ${props => props.theme.fontSizes.md};
  cursor: pointer;
  border-radius: ${props => props.theme.radii.md};

  &:hover {
    background-color: ${props => props.theme.colors.primaryLight};
  }
`;

interface NotificationPopupProps {
  onClose: () => void;
  onNotificationClick: (notification: ApiNotification) => void; // To handle navigation and marking as read
  onMarkAllRead: () => Promise<void>; // Callback after marking all as read
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ onClose, onNotificationClick, onMarkAllRead }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'archive' | 'comments'>('inbox');
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // In a real app, you might filter by read status on the backend
      // For now, we fetch all and filter client-side based on tab for simplicity
      const response = await fetch('/api/notifications?limit=50', { // Fetch more for client-side tab filtering
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await onMarkAllRead();
    fetchNotifications(); // Refresh list
  };

  const currentNotifications = notifications.filter(n => {
    if (activeTab === 'inbox') return !n.read;
    if (activeTab === 'archive') return n.read;
    return false;
  });

  const getNotificationMessage = (n: ApiNotification): string => {
    const user = n.triggeringUser?.username || 'Someone';
    switch (n.type) {
      case 'NEW_COMMENT_ON_POST':
        return `${user} commented on your post: "${n.post?.title || 'a post'}"`;
      case 'REPLY_TO_COMMENT':
        return `${user} replied to your comment: "${n.comment?.textContent?.substring(0,30) || 'your comment'}..."`;
      default:
        return 'New notification';
    }
  };

  return (
    <PopupContainer>
      <Tabs onClick={(e) => e.stopPropagation()}>
        <TabButton active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')}>Inbox</TabButton>
        <TabButton active={activeTab === 'archive'} onClick={() => setActiveTab('archive')}>Archive</TabButton>
      </Tabs>
      <NotificationList>
        {loading && <p style={{padding: '20px', textAlign: 'center'}}>Loading...</p>}
        {!loading && currentNotifications.length === 0 && (
          <EmptyState>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.822 7.431A1 1 0 0021 7H7.828L5.586 4.757A1 1 0 004.172 4H3a1 1 0 000 2h.828L5.172 7.243A1 1 0 005.828 7H9V5a1 1 0 011-1h4a1 1 0 011 1v2h1a1 1 0 011 1v2.172l4.414 4.414A2.002 2.002 0 0022 14.586V9a1 1 0 00-.178-.569z" /><path d="M3 9.172V19a2 2 0 002 2h13.172l-2.829-2.829A4.002 4.002 0 0114.586 16H9a1 1 0 110-2h5.586l-1.293-1.293A1.998 1.998 0 0012.586 12H9a3 3 0 00-3 3v.172l-3.757-3.757A1 1 0 001.586 11H.999a1 1 0 000 2h.172l2.656 2.656A1.5 1.5 0 003 16.414V9.172z" /></svg>
            <p>{
              activeTab === 'inbox' ? 'No new notifications' :
              activeTab === 'archive' ? 'No archived notifications' :
              'No comment-related notifications'
            }</p>
          </EmptyState>
        )}
        {!loading && currentNotifications.map(n => (
          <NotificationItemStyled key={n.id} read={n.read} onClick={() => onNotificationClick(n)}>
            <p>{getNotificationMessage(n)}</p>
            <small>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</small>
          </NotificationItemStyled>
        ))}
      </NotificationList>
      {activeTab === 'inbox' && notifications.some(n => !n.read) && (
        <Footer>
          <MarkAllReadButton onClick={handleMarkAllRead}>Mark all as read</MarkAllReadButton>
        </Footer>
      )}
    </PopupContainer>
  );
};

export default NotificationPopup; 
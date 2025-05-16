import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth';
import NotificationPopup from './NotificationPopup';
import type { ApiNotification } from './NotificationPopup'; // Import the type
import { useRouter } from 'next/navigation'; // For navigation

// A simple Bell SVG. Replace with your preferred icon library or a more complex SVG.
const BellIcon = () => (
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
      d="M7.9925 0C4.95079 0 2.485 2.46579 2.485 5.5075V8.22669C2.485 8.77318 2.21321 9.28388 1.75992 9.58912L1.33108 9.8779L1 10.1009V10.5V11.25V12H1.75H14.25H15V11.25V10.5V10.0986L14.666 9.87596L14.2306 9.58565C13.7741 9.28137 13.5 8.76913 13.5 8.22059V5.5075C13.5 2.46579 11.0342 0 7.9925 0ZM3.985 5.5075C3.985 3.29422 5.77922 1.5 7.9925 1.5C10.2058 1.5 12 3.29422 12 5.5075V8.22059C12 9.09029 12.36 9.91233 12.9801 10.5H3.01224C3.62799 9.91235 3.985 9.09303 3.985 8.22669V5.5075ZM10.7486 13.5H9.16778L9.16337 13.5133C9.09591 13.716 8.94546 13.9098 8.72067 14.0501C8.52343 14.1732 8.27577 14.25 8.00002 14.25C7.72426 14.25 7.47661 14.1732 7.27936 14.0501C7.05458 13.9098 6.90412 13.716 6.83666 13.5133L6.83225 13.5H5.25143L5.41335 13.9867C5.60126 14.5516 5.99263 15.0152 6.48523 15.3226C6.92164 15.5949 7.44461 15.75 8.00002 15.75C8.55542 15.75 9.07839 15.5949 9.5148 15.3226C10.0074 15.0152 10.3988 14.5516 10.5867 13.9867L10.7486 13.5Z"
      fill="currentColor"
    ></path>
  </svg>
);

const BellContainer = styled.div`
  position: relative;
  cursor: pointer;
  padding: ${props => props.theme.space.sm};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.theme.colors.secondaryLight};
  }
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: 0px;
  right: 0px;
  background-color: ${props => props.theme.colors.error}; // Or your primary notification color
  border-radius: 50%;
  padding: 2px 5px;
  font-size: 10px;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  line-height: 1;
`;

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();
  const router = useRouter();
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      // Fetch all notifications and count unread ones client-side for simplicity here.
      // For performance, you could have a dedicated API endpoint for unread count.
      const response = await fetch('/api/notifications?limit=100', { // Fetch a decent number to count
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const count = (data.notifications || []).filter((n: ApiNotification) => !n.read).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll for unread count periodically (e.g., every minute)
      const intervalId = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(intervalId);
    }
  }, [user, fetchUnreadCount]);

  // Close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBellClick = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) { // If opening, refresh count and notifications
      fetchUnreadCount(); 
    }
  };

  const handleNotificationClick = async (notification: ApiNotification) => {
    if (!token) return;
    try {
      // Mark as read
      if (!notification.read) {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchUnreadCount(); // Refresh unread count
      }
      setIsOpen(false); // Close popup
      
      // Navigate to the source of the notification
      if (notification.post && notification.type === 'NEW_COMMENT_ON_POST') {
        router.push(`/post/${notification.post.id}#comment-${notification.comment?.id}`);
      } else if (notification.comment && notification.type === 'REPLY_TO_COMMENT') {
        router.push(`/post/${notification.post?.id}#comment-${notification.comment.id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/mark-all-as-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUnreadCount(); // Refresh unread count
      // The popup will refetch its own list
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!user) return null; // Don't show if not logged in

  return (
    <BellContainer ref={bellRef} onClick={handleBellClick}>
      <BellIcon />
      {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
      {isOpen && 
        <NotificationPopup 
          onClose={() => setIsOpen(false)} 
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
        />
      }
    </BellContainer>
  );
};

export default NotificationBell; 
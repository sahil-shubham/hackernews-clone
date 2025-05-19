'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/lib/authUtils';
import NotificationPopup from './NotificationPopup';
import type { ApiNotification } from './NotificationPopup';
import { useRouter } from 'next/navigation';
import { Bell, BellDot } from 'lucide-react';

interface NotificationBellProps {
  user: User | null;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const response = await fetch('/api/notifications?limit=100', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const count = (data.notifications || []).filter((n: ApiNotification) => !n.read).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const intervalId = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(intervalId);
    }
  }, [user, fetchUnreadCount]);

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
    if (!isOpen && user) {
      fetchUnreadCount(); 
    }
  };

  const handleNotificationClick = async (notification: ApiNotification) => {
    if (!user || !user.token) return;
    try {
      if (!notification.read) {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${user.token}` },
        });
        fetchUnreadCount(); 
      }
      setIsOpen(false); 
      
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
    if (!user || !user.token) return;
    try {
      await fetch('/api/notifications/mark-all-as-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchUnreadCount(); 
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div 
      ref={bellRef} 
      onClick={handleBellClick} 
      className="relative cursor-pointer p-2 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
    >
      {unreadCount > 0 ? (
        <BellDot className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isOpen && user &&
        <NotificationPopup 
          user={user}
          onClose={() => setIsOpen(false)} 
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
        />
      }
    </div>
  );
};

export default NotificationBell; 
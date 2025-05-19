'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import NotificationPopup from './NotificationPopup';
import type { ApiNotification } from './NotificationPopup';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useAuthStore((state) => state.user)
  const router = useRouter();
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
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
    if (!user) return;
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
    if (!user) return;
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
      className="relative cursor-pointer p-2 rounded-full flex items-center justify-center hover:bg-muted"
    >
      <Bell className="h-5 w-5 text-foreground" />
      {unreadCount > 0 && (
        <span 
          className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs font-bold min-w-[18px] text-center leading-none"
        >
          {unreadCount}
        </span>
      )}
      {isOpen && 
        <NotificationPopup 
          onClose={() => setIsOpen(false)} 
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
        />
      }
    </div>
  );
};

export default NotificationBell; 
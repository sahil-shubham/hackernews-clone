'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/authUtils';
import { formatDistanceToNow } from 'date-fns';
import { BellOff, CheckCheck } from 'lucide-react'; // Import icons
import { Button } from '@/components/ui/Button'; // Import custom Button

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

interface NotificationPopupProps {
  onClose: () => void;
  onNotificationClick: (notification: ApiNotification) => void;
  onMarkAllRead: () => Promise<void>;
  user: User | null;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ onClose, onNotificationClick, onMarkAllRead, user }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'archive'>('inbox'); // Removed 'comments' tab for now
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user || !user.token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=50', {
        headers: { Authorization: `Bearer ${user.token}` }, // Ensured user.token is accessed safely
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
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await onMarkAllRead();
    fetchNotifications();
  };

  const currentNotifications = notifications.filter(n => {
    if (activeTab === 'inbox') return !n.read;
    if (activeTab === 'archive') return n.read;
    return false;
  });

  const getNotificationMessage = (n: ApiNotification): string => {
    const triggeringUsername = n.triggeringUser?.username || 'Someone';
    switch (n.type) {
      case 'NEW_COMMENT_ON_POST':
        return `${triggeringUsername} commented on your post: "${n.post?.title || 'a post'}"`;
      case 'REPLY_TO_COMMENT':
        const commentSnippet = n.comment?.textContent ? `"${n.comment.textContent.substring(0, 30)}..."` : 'your comment';
        return `${triggeringUsername} replied to ${commentSnippet}`;
      default:
        return 'New notification';
    }
  };

  return (
    // PopupContainer
    <div 
      className="absolute top-[60px] right-[10px] w-[400px] max-h-[500px] bg-card border border-border rounded-lg shadow-lg z-[1000] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside popup
    >
      {/* Tabs */}
      <div className="flex bg-muted/50">
        {/* TabButton - Inbox */}
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 hover:bg-muted focus:outline-none
            ${activeTab === 'inbox' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:border-muted-foreground/50'}`}
        >
          Inbox
        </button>
        {/* TabButton - Archive */}
        <button
          onClick={() => setActiveTab('archive')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 hover:bg-muted focus:outline-none
            ${activeTab === 'archive' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:border-muted-foreground/50'}`}
        >
          Archive
        </button>
      </div>

      {/* NotificationList */}
      <ul className="list-none m-0 p-0 overflow-y-auto flex-grow">
        {loading && <p className="p-5 text-center text-muted-foreground">Loading...</p>}
        {!loading && currentNotifications.length === 0 && (
          // EmptyState
          <div className="flex flex-col items-center justify-center p-5 text-center text-muted-foreground h-full min-h-[200px]">
            <BellOff className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <p>
              {activeTab === 'inbox' ? 'No new notifications' : 'No archived notifications'}
            </p>
          </div>
        )}
        {!loading && currentNotifications.map(n => (
          // NotificationItemStyled
          <li 
            key={n.id} 
            onClick={() => onNotificationClick(n)}
            className={`py-3 px-4 border-b border-border cursor-pointer
              ${!n.read ? 'bg-primary/10 hover:bg-primary/20' : 'bg-card hover:bg-muted/50'}
              ${n.read ? 'opacity-70' : 'opacity-100'}`}
          >
            <p className="m-0 mb-1 text-sm text-foreground">{getNotificationMessage(n)}</p>
            <small className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </small>
          </li>
        ))}
      </ul>

      {/* Footer */}
      {activeTab === 'inbox' && notifications.some(n => !n.read) && (
        <div className="p-3 border-t border-border text-center">
          {/* MarkAllReadButton */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleMarkAllRead} 
            className="text-primary hover:bg-primary/10"
          >
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationPopup; 
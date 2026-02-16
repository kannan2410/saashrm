import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getSocket } from '../../services/socket';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { ChatMessage } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { activeChannel, incrementUnread, fetchChannels, fetchDirectMessages } = useChatStore();
  const activeChannelRef = useRef(activeChannel);
  const locationRef = useRef(location.pathname);

  // Keep refs in sync
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);
  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);

  // Global socket listener for unread message tracking
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    // Fetch channels/DMs once so sidebar badge can work
    fetchChannels();
    fetchDirectMessages();

    const handleNewMessage = (message: ChatMessage) => {
      const isOnChatPage = locationRef.current.startsWith('/chat');
      const isActiveChannel = activeChannelRef.current?.id === message.channelId;

      // Only count as unread if not viewing that channel right now
      if (!isOnChatPage || !isActiveChannel) {
        // Don't count own messages
        if (message.sender.id !== user.id) {
          incrementUnread(message.channelId);
        }
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => { socket.off('message:new', handleNewMessage); };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-[260px]">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

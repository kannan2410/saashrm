import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { getSocket } from '../services/socket';
import api from '../services/api';
import { ChatMessage, ChatChannel } from '../types';
import Modal from '../components/ui/Modal';
import {
  Send, Hash, Lock, Plus, Pin, Paperclip, Users, UserPlus,
  Check, MessageCircle, Trash2, Circle, Smile, Reply, X, CornerDownRight,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface CompanyUser {
  id: string;
  email: string;
  role: string;
  customStatus?: string | null;
  employee?: { fullName: string; department: string };
}

interface ChannelMember {
  id: string;
  user: { id: string; email: string; employee?: { fullName: string } };
}

const STATUS_OPTIONS = [
  { value: 'Available', color: 'bg-green-500', label: 'Available' },
  { value: 'Busy', color: 'bg-red-500', label: 'Busy' },
  { value: 'Away', color: 'bg-yellow-500', label: 'Away' },
  { value: 'Do Not Disturb', color: 'bg-red-600', label: 'Do Not Disturb' },
  { value: '', color: 'bg-content-muted', label: 'Clear Status' },
];

function getStatusColor(status?: string | null) {
  if (!status) return 'bg-content-muted';
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return opt?.color || 'bg-content-muted';
}

// Swipeable message — swipe right to reply
function SwipeableMessage({
  msg,
  isOwn,
  onReply,
  onDelete,
  onPin,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onReply: (msg: ChatMessage) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startXRef.current;
    // Swipe right to reveal reply
    const clampedDiff = Math.max(0, Math.min(80, diff));
    currentXRef.current = clampedDiff;
    setSwipeX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (!swiping) return;
    setSwiping(false);
    if (currentXRef.current > 50) {
      onReply(msg);
    }
    setSwipeX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    currentXRef.current = 0;
    setSwiping(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!swiping) return;
    const diff = e.clientX - startXRef.current;
    const clampedDiff = Math.max(0, Math.min(80, diff));
    currentXRef.current = clampedDiff;
    setSwipeX(clampedDiff);
  }, [swiping]);

  const handleMouseUp = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);
    if (currentXRef.current > 50) {
      onReply(msg);
    }
    setSwipeX(0);
  }, [swiping, msg, onReply]);

  useEffect(() => {
    if (swiping) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [swiping, handleMouseMove, handleMouseUp]);

  const senderName = msg.sender.employee?.fullName || msg.sender.email;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Reply icon behind (left side) */}
      {swipeX > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 z-0">
          <div className={clsx(
            'flex items-center gap-1 text-primary-600 transition-opacity',
            swipeX > 50 ? 'opacity-100' : 'opacity-40'
          )}>
            <Reply className="h-5 w-5" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div
        className={clsx('flex gap-3 group relative z-10 bg-surface-card py-1', isOwn && 'flex-row-reverse')}
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.2s ease' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
          {senderName.charAt(0).toUpperCase()}
        </div>
        <div className={clsx('max-w-md', isOwn && 'text-right')}>
          <div className={clsx('flex items-center gap-2 mb-0.5', isOwn && 'flex-row-reverse')}>
            <span className="text-sm font-medium text-content-primary">{senderName}</span>
            <span className="text-xs text-content-muted">{format(new Date(msg.createdAt), 'hh:mm a')}</span>
            {msg.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
          </div>

          {/* Quoted reply */}
          {msg.replyTo && (
            <div className={clsx(
              'flex items-start gap-1.5 mb-1 px-2.5 py-1.5 rounded-lg border-l-3 border-primary-400 bg-surface-bg text-left',
              isOwn && 'ml-auto'
            )}>
              <CornerDownRight className="h-3 w-3 text-content-muted mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary-600 truncate">
                  {msg.replyTo.sender.employee?.fullName || msg.replyTo.sender.email}
                </p>
                <p className="text-xs text-content-muted truncate">{msg.replyTo.content}</p>
              </div>
            </div>
          )}

          <div className={clsx('inline-block px-3 py-2 rounded-xl text-sm', isOwn ? 'bg-primary-600 text-white' : 'bg-surface-bg text-content-primary')}>
            {msg.content}
          </div>
          {msg.files && msg.files.length > 0 && (
            <div className="mt-1">
              {msg.files.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">{f.fileName}</a>
              ))}
            </div>
          )}
          <div className="hidden group-hover:flex items-center gap-2 mt-1">
            <button onClick={() => onReply(msg)} className="text-xs text-content-muted hover:text-primary-600 flex items-center gap-0.5">
              <Reply className="h-3 w-3" /> Reply
            </button>
            <button onClick={() => onPin(msg.id)} className="text-xs text-content-muted hover:text-amber-500">
              {msg.isPinned ? 'Unpin' : 'Pin'}
            </button>
            {isOwn && (
              <button onClick={() => onDelete(msg.id)} className="text-xs text-content-muted hover:text-red-500 flex items-center gap-0.5">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const {
    channels, directMessages, activeChannel, messages, unreadCounts,
    fetchChannels, fetchDirectMessages, setActiveChannel,
    fetchMessages, addMessage, removeMessage, createChannel, startDirectMessage, clearUnread,
  } = useChatStore();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isNewDmOpen, setIsNewDmOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [channelForm, setChannelForm] = useState({ name: '', description: '', type: 'PUBLIC', memberIds: [] as string[] });
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(new Map());
  const [myStatus, setMyStatus] = useState(user?.customStatus || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    fetchChannels();
    fetchDirectMessages();
    const socket = socketRef.current;

    socket.on('message:new', (message: ChatMessage) => {
      addMessage(message);
    });

    socket.on('message:deleted', (data: { id: string }) => {
      removeMessage(data.id);
    });

    socket.on('presence:list', (userIds: string[]) => {
      setOnlineUserIds(new Set(userIds));
    });

    socket.on('presence:online', (data: { userId: string }) => {
      setOnlineUserIds((prev) => new Set([...prev, data.userId]));
    });

    socket.on('presence:offline', (data: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    socket.on('status:changed', (data: { userId: string; customStatus: string | null }) => {
      setUserStatuses((prev) => {
        const next = new Map(prev);
        if (data.customStatus) {
          next.set(data.userId, data.customStatus);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    return () => {
      socket.off('message:new');
      socket.off('message:deleted');
      socket.off('presence:list');
      socket.off('presence:online');
      socket.off('presence:offline');
      socket.off('status:changed');
    };
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      clearUnread(activeChannel.id);
      socketRef.current.emit('join:channel', activeChannel.id);
      setReplyTo(null);
    }
  }, [activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCompanyUsers = async () => {
    const res = await api.get('/chat/users');
    setCompanyUsers(res.data.data);
  };

  const fetchChannelMembers = async (channelId: string) => {
    const res = await api.get(`/chat/channels/${channelId}/members`);
    setChannelMembers(res.data.data);
  };

  // ── Handlers ────────────────────────────────────────────

  const handleSend = () => {
    if (!messageInput.trim() || !activeChannel) return;
    socketRef.current.emit('message:send', {
      channelId: activeChannel.id,
      content: messageInput.trim(),
      replyToId: replyTo?.id || undefined,
    });
    setMessageInput('');
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape' && replyTo) { setReplyTo(null); }
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannel) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    socketRef.current.emit('message:send', {
      channelId: activeChannel.id,
      content: `Shared file: ${file.name}`,
      fileData: res.data.data,
    });
  };

  const handlePin = async (messageId: string) => {
    socketRef.current.emit('message:pin', messageId);
  };

  const handleDeleteMessage = (messageId: string) => {
    socketRef.current.emit('message:delete', messageId);
    if (replyTo?.id === messageId) setReplyTo(null);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    await createChannel(channelForm);
    setIsCreateOpen(false);
    setChannelForm({ name: '', description: '', type: 'PUBLIC', memberIds: [] });
  };

  const handleOpenCreate = () => {
    fetchCompanyUsers();
    setChannelForm({ name: '', description: '', type: 'PUBLIC', memberIds: [] });
    setUserSearch('');
    setIsCreateOpen(true);
  };

  const handleOpenMembers = () => {
    if (activeChannel) { fetchChannelMembers(activeChannel.id); setIsMembersOpen(true); }
  };

  const handleOpenAddMember = () => {
    fetchCompanyUsers();
    if (activeChannel) fetchChannelMembers(activeChannel.id);
    setUserSearch('');
    setIsAddMemberOpen(true);
  };

  const handleAddMember = async (userId: string) => {
    if (!activeChannel) return;
    await api.post(`/chat/channels/${activeChannel.id}/members`, { userId });
    await fetchChannelMembers(activeChannel.id);
    await fetchChannels();
  };

  const toggleMemberSelection = (userId: string) => {
    setChannelForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  const handleOpenNewDm = () => {
    fetchCompanyUsers();
    setUserSearch('');
    setIsNewDmOpen(true);
  };

  const handleStartDm = async (userId: string) => {
    const dm = await startDirectMessage(userId);
    setActiveChannel(dm);
    setIsNewDmOpen(false);
  };

  const handleSetStatus = (status: string) => {
    setMyStatus(status);
    socketRef.current.emit('status:update', status);
    setIsStatusOpen(false);
  };

  // ── Derived ─────────────────────────────────────────────

  const memberUserIds = channelMembers.map((m) => m.user.id);
  const existingDmUserIds = directMessages.map((dm) => dm.otherUser?.id).filter(Boolean);

  const filteredUsers = companyUsers.filter((u) => {
    const search = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(search) ||
      u.employee?.fullName?.toLowerCase().includes(search) ||
      u.employee?.department?.toLowerCase().includes(search)
    );
  });

  const getDisplayName = (channel: ChatChannel) => {
    if (channel.type === 'DIRECT' && channel.otherUser) {
      return channel.otherUser.employee?.fullName || channel.otherUser.email;
    }
    return channel.name;
  };

  const getPlaceholder = () => {
    if (!activeChannel) return '';
    if (replyTo) return `Reply to ${replyTo.sender.employee?.fullName || replyTo.sender.email}...`;
    if (activeChannel.type === 'DIRECT') return `Message ${getDisplayName(activeChannel)}`;
    return `Message #${activeChannel.name}`;
  };

  const isUserOnline = (userId?: string | null) => userId ? onlineUserIds.has(userId) : false;

  const getUserStatus = (userId?: string | null) => {
    if (!userId) return null;
    return userStatuses.get(userId) || null;
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-surface-card rounded-xl shadow-card border border-surface-border overflow-hidden">

      {/* ══════════ SIDEBAR ══════════ */}
      <div className="w-72 border-r border-surface-border flex flex-col">

        {/* My Status */}
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={() => setIsStatusOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-bg transition-colors text-left"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                {user?.employee?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
              </div>
              <span className={clsx('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-card', myStatus ? getStatusColor(myStatus) : 'bg-green-500')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary truncate">{user?.employee?.fullName || user?.email}</p>
              <p className="text-xs text-content-muted truncate flex items-center gap-1">
                <Smile className="h-3 w-3" />
                {myStatus || 'Set a status'}
              </p>
            </div>
          </button>
        </div>

        <div className="border-b border-surface-border mx-3" />

        {/* Channels Section */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-content-muted uppercase tracking-wider">Channels</h2>
            <button onClick={handleOpenCreate} className="p-1 text-content-muted hover:text-primary-600 hover:bg-surface-bg rounded" title="Create Channel">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="px-2 space-y-0.5">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                activeChannel?.id === channel.id
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-content-secondary hover:bg-surface-bg'
              )}
            >
              {channel.type === 'PUBLIC' ? <Hash className="h-4 w-4 flex-shrink-0" /> : <Lock className="h-4 w-4 flex-shrink-0" />}
              <span className="truncate">{channel.name}</span>
              {unreadCounts[channel.id] > 0 ? (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-danger-500 text-white text-[11px] font-bold rounded-full">
                  {unreadCounts[channel.id] > 99 ? '99+' : unreadCounts[channel.id]}
                </span>
              ) : channel._count ? (
                <span className="ml-auto text-xs text-content-muted">{channel._count.members}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Direct Messages Section */}
        <div className="px-4 pt-5 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-content-muted uppercase tracking-wider">Direct Messages</h2>
            <button onClick={handleOpenNewDm} className="p-1 text-content-muted hover:text-primary-600 hover:bg-surface-bg rounded" title="New Message">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {directMessages.map((dm) => {
            const name = dm.otherUser?.employee?.fullName || dm.otherUser?.email || 'Unknown';
            const initial = name.charAt(0).toUpperCase();
            const otherUserId = dm.otherUser?.id;
            const online = isUserOnline(otherUserId);
            const status = getUserStatus(otherUserId);
            return (
              <button
                key={dm.id}
                onClick={() => setActiveChannel(dm)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  activeChannel?.id === dm.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-content-secondary hover:bg-surface-bg'
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-xl bg-surface-bg text-content-secondary flex items-center justify-center text-xs font-medium">
                    {initial}
                  </div>
                  <span className={clsx(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card',
                    online ? (status ? getStatusColor(status) : 'bg-green-500') : 'bg-surface-border'
                  )} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={clsx('truncate', unreadCounts[dm.id] > 0 && 'font-semibold text-content-primary')}>{name}</p>
                  {dm.lastMessage ? (
                    <p className="text-xs text-content-muted truncate">{dm.lastMessage.content}</p>
                  ) : status ? (
                    <p className="text-xs text-content-muted truncate">{status}</p>
                  ) : null}
                </div>
                {unreadCounts[dm.id] > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-danger-500 text-white text-[11px] font-bold rounded-full flex-shrink-0">
                    {unreadCounts[dm.id] > 99 ? '99+' : unreadCounts[dm.id]}
                  </span>
                )}
              </button>
            );
          })}
          {directMessages.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-content-muted">No conversations yet</p>
              <button onClick={handleOpenNewDm} className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium">
                Start a conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ CHAT AREA ══════════ */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Header */}
            <div className="px-6 py-3 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeChannel.type === 'DIRECT' ? (
                  <>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                        {getDisplayName(activeChannel).charAt(0).toUpperCase()}
                      </div>
                      <span className={clsx(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card',
                        isUserOnline(activeChannel.otherUser?.id)
                          ? (getUserStatus(activeChannel.otherUser?.id) ? getStatusColor(getUserStatus(activeChannel.otherUser?.id)) : 'bg-green-500')
                          : 'bg-gray-300'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-content-primary">{getDisplayName(activeChannel)}</h3>
                      <p className="text-xs text-content-muted">
                        {isUserOnline(activeChannel.otherUser?.id)
                          ? (getUserStatus(activeChannel.otherUser?.id) || 'Online')
                          : 'Offline'
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {activeChannel.type === 'PUBLIC' ? <Hash className="h-5 w-5 text-content-muted" /> : <Lock className="h-5 w-5 text-content-muted" />}
                    <h3 className="font-semibold text-content-primary">{activeChannel.name}</h3>
                    {activeChannel.description && <span className="text-xs text-content-muted ml-2">{activeChannel.description}</span>}
                  </>
                )}
              </div>
              {activeChannel.type !== 'DIRECT' && (
                <div className="flex items-center gap-1">
                  <button onClick={handleOpenAddMember} className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-content-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Add Member">
                    <UserPlus className="h-4 w-4" /><span className="text-xs font-medium">Add</span>
                  </button>
                  <button onClick={handleOpenMembers} className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-content-muted hover:text-content-primary hover:bg-surface-bg rounded-lg transition-colors" title="View Members">
                    <Users className="h-4 w-4" /><span className="text-xs font-medium">{activeChannel._count?.members || 0}</span>
                  </button>
                  <button className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-bg rounded" title="Pinned Messages">
                    <Pin className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-content-muted">
                  <MessageCircle className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">
                    {activeChannel.type === 'DIRECT'
                      ? `Start your conversation with ${getDisplayName(activeChannel)}`
                      : `No messages in #${activeChannel.name} yet`
                    }
                  </p>
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.sender.id === user?.id;
                return (
                  <SwipeableMessage
                    key={msg.id}
                    msg={msg}
                    isOwn={isOwn}
                    onReply={handleReply}
                    onDelete={handleDeleteMessage}
                    onPin={handlePin}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview Bar */}
            {replyTo && (
              <div className="px-6 py-2 bg-surface-bg border-t border-surface-border flex items-center gap-3">
                <Reply className="h-4 w-4 text-primary-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary-600">
                    Replying to {replyTo.sender.employee?.fullName || replyTo.sender.email}
                  </p>
                  <p className="text-xs text-content-muted truncate">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 text-content-muted hover:text-content-secondary rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-6 py-3 border-t border-surface-border">
              <div className="flex items-center gap-2 bg-surface-bg rounded-xl px-3 py-2 border border-surface-border focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                <label className="cursor-pointer text-content-muted hover:text-content-secondary">
                  <Paperclip className="h-5 w-5" />
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder()}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
                <button onClick={handleSend} disabled={!messageInput.trim()} className="p-1.5 text-primary-600 hover:text-primary-700 disabled:opacity-40">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-content-muted">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a channel or direct message to start chatting</p>
              <button onClick={handleOpenNewDm} className="btn-primary mt-4 inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> New Direct Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ STATUS MODAL ══════════ */}
      <Modal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} title="Set Your Status">
        <div className="space-y-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSetStatus(opt.value)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                myStatus === opt.value ? 'bg-primary-50 text-primary-700' : 'hover:bg-surface-bg text-content-secondary'
              )}
            >
              <Circle className={clsx('h-3 w-3 fill-current', opt.color.replace('bg-', 'text-'))} />
              <span className="text-sm font-medium">{opt.label}</span>
              {myStatus === opt.value && <Check className="h-4 w-4 ml-auto text-primary-600" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* ══════════ NEW DM MODAL ══════════ */}
      <Modal isOpen={isNewDmOpen} onClose={() => setIsNewDmOpen(false)} title="New Direct Message">
        <p className="text-sm text-content-muted mb-3">Select a person to start a conversation</p>
        <input
          type="text"
          className="input-field mb-3"
          placeholder="Search by name, email, or department..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
        <div className="max-h-72 overflow-y-auto border border-surface-border rounded-lg divide-y divide-surface-border">
          {filteredUsers
            .filter((u) => u.id !== user?.id)
            .map((u) => {
              const hasDm = existingDmUserIds.includes(u.id);
              const online = isUserOnline(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => handleStartDm(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-surface-bg transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                      {u.employee?.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                    </div>
                    <span className={clsx(
                      'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card',
                      online ? (u.customStatus ? getStatusColor(u.customStatus) : 'bg-green-500') : 'bg-surface-border'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate">
                      {u.employee?.fullName || u.email}
                    </p>
                    <p className="text-xs text-content-muted truncate">
                      {u.customStatus && <span className="mr-1">{u.customStatus} ·</span>}
                      {u.email} {u.employee?.department && `· ${u.employee.department}`} · {u.role}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {hasDm ? (
                      <span className="text-xs text-content-muted bg-surface-bg px-2 py-1 rounded-full">Open</span>
                    ) : (
                      <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full font-medium">Message</span>
                    )}
                  </div>
                </button>
              );
            })}
          {filteredUsers.filter((u) => u.id !== user?.id).length === 0 && (
            <p className="px-3 py-6 text-sm text-content-muted text-center">No users found</p>
          )}
        </div>
      </Modal>

      {/* ══════════ CREATE CHANNEL MODAL ══════════ */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Channel" size="lg">
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Channel Name</label>
              <input className="input-field" value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} placeholder="e.g. engineering" required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={channelForm.type} onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value })}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input-field" value={channelForm.description} onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })} placeholder="What's this channel about?" />
          </div>
          <div>
            <label className="label">Add Members ({channelForm.memberIds.length} selected)</label>
            <input type="text" className="input-field mb-2" placeholder="Search by name, email, or department..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            <div className="max-h-48 overflow-y-auto border border-surface-border rounded-lg divide-y divide-surface-border">
              {filteredUsers.map((u) => {
                const isSelected = channelForm.memberIds.includes(u.id);
                const isSelf = u.id === user?.id;
                return (
                  <button key={u.id} type="button" onClick={() => !isSelf && toggleMemberSelection(u.id)} disabled={isSelf}
                    className={clsx('w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors', isSelected ? 'bg-primary-50' : 'hover:bg-surface-bg', isSelf && 'opacity-50 cursor-not-allowed')}>
                    <div className="w-8 h-8 rounded-xl bg-surface-bg text-content-secondary flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {u.employee?.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate">{u.employee?.fullName || u.email}{isSelf && <span className="text-xs text-content-muted ml-1">(you)</span>}</p>
                      <p className="text-xs text-content-muted truncate">{u.email} {u.employee?.department && `· ${u.employee.department}`}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                  </button>
                );
              })}
              {filteredUsers.length === 0 && <p className="px-3 py-4 text-sm text-content-muted text-center">No users found</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Channel</button>
          </div>
        </form>
      </Modal>

      {/* ══════════ VIEW MEMBERS MODAL ══════════ */}
      <Modal isOpen={isMembersOpen} onClose={() => setIsMembersOpen(false)} title={`Members — #${activeChannel?.name || ''}`}>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {channelMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-bg">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                  {m.user.employee?.fullName?.charAt(0) || m.user.email.charAt(0).toUpperCase()}
                </div>
                <span className={clsx(
                  'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card',
                  isUserOnline(m.user.id) ? 'bg-green-500' : 'bg-gray-300'
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-content-primary">{m.user.employee?.fullName || m.user.email}{m.user.id === user?.id && <span className="text-xs text-content-muted ml-1">(you)</span>}</p>
                <p className="text-xs text-content-muted">{m.user.email}</p>
              </div>
            </div>
          ))}
          {channelMembers.length === 0 && <p className="text-center py-6 text-sm text-content-muted">No members yet</p>}
        </div>
        <div className="pt-4 border-t mt-4">
          <button onClick={() => { setIsMembersOpen(false); handleOpenAddMember(); }} className="btn-primary flex items-center gap-2 w-full justify-center">
            <UserPlus className="h-4 w-4" /> Add People
          </button>
        </div>
      </Modal>

      {/* ══════════ ADD MEMBER MODAL ══════════ */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title={`Add People to #${activeChannel?.name || ''}`}>
        <input type="text" className="input-field mb-3" placeholder="Search by name, email, or department..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
        <div className="max-h-72 overflow-y-auto border border-surface-border rounded-lg divide-y divide-surface-border">
          {filteredUsers.map((u) => {
            const alreadyMember = memberUserIds.includes(u.id);
            return (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-surface-bg text-content-secondary flex items-center justify-center text-xs font-medium">
                    {u.employee?.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                  </div>
                  <span className={clsx(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card',
                    isUserOnline(u.id) ? 'bg-green-500' : 'bg-gray-300'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content-primary truncate">{u.employee?.fullName || u.email}</p>
                  <p className="text-xs text-content-muted truncate">{u.email} {u.employee?.department && `· ${u.employee.department}`}</p>
                </div>
                {alreadyMember ? (
                  <span className="text-xs text-content-muted bg-surface-bg px-2 py-1 rounded-full">Member</span>
                ) : (
                  <button onClick={() => handleAddMember(u.id)} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors">
                    <UserPlus className="h-3.5 w-3.5" /> Add
                  </button>
                )}
              </div>
            );
          })}
          {filteredUsers.length === 0 && <p className="px-3 py-6 text-sm text-content-muted text-center">No users found</p>}
        </div>
      </Modal>
    </div>
  );
}

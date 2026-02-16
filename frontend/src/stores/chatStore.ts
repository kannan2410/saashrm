import { create } from 'zustand';
import api from '../services/api';
import { ChatChannel, ChatMessage } from '../types';

interface ChatState {
  channels: ChatChannel[];
  directMessages: ChatChannel[];
  activeChannel: ChatChannel | null;
  messages: ChatMessage[];
  isLoading: boolean;
  unreadCounts: Record<string, number>;
  totalUnread: number;
  fetchChannels: () => Promise<void>;
  fetchDirectMessages: () => Promise<void>;
  setActiveChannel: (channel: ChatChannel) => void;
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (messageId: string) => void;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  createChannel: (data: { name: string; description?: string; type: string; memberIds?: string[] }) => Promise<void>;
  startDirectMessage: (userId: string) => Promise<ChatChannel>;
}

function calcTotal(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  directMessages: [],
  activeChannel: null,
  messages: [],
  isLoading: false,
  unreadCounts: {},
  totalUnread: 0,

  fetchChannels: async () => {
    const res = await api.get('/chat/channels');
    set({ channels: res.data.data });
  },

  fetchDirectMessages: async () => {
    const res = await api.get('/chat/dm');
    set({ directMessages: res.data.data });
  },

  setActiveChannel: (channel) => {
    const counts = { ...get().unreadCounts };
    delete counts[channel.id];
    set({ activeChannel: channel, messages: [], unreadCounts: counts, totalUnread: calcTotal(counts) });
  },

  fetchMessages: async (channelId) => {
    set({ isLoading: true });
    const res = await api.get(`/chat/channels/${channelId}/messages`);
    set({ messages: (res.data.data as ChatMessage[]).reverse(), isLoading: false });
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  removeMessage: (messageId) => {
    set((state) => ({ messages: state.messages.filter((m) => m.id !== messageId) }));
  },

  incrementUnread: (channelId) => {
    const counts = { ...get().unreadCounts };
    counts[channelId] = (counts[channelId] || 0) + 1;
    set({ unreadCounts: counts, totalUnread: calcTotal(counts) });
  },

  clearUnread: (channelId) => {
    const counts = { ...get().unreadCounts };
    delete counts[channelId];
    set({ unreadCounts: counts, totalUnread: calcTotal(counts) });
  },

  createChannel: async (data) => {
    await api.post('/chat/channels', data);
    await get().fetchChannels();
  },

  startDirectMessage: async (userId) => {
    const res = await api.post('/chat/dm', { userId });
    const dm: ChatChannel = res.data.data;
    await get().fetchDirectMessages();
    return dm;
  },
}));

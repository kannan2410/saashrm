import { create } from 'zustand';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';
import { User, Role } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  sendOtp: (companyName: string, fullName: string, email: string, password: string) => Promise<void>;
  verifyOtpAndSignup: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token } = res.data.data;
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true, isLoading: false });
      await get().fetchProfile();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  sendOtp: async (companyName, fullName, email, password) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/send-otp', { companyName, fullName, email, password });
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  verifyOtpAndSignup: async (email, otp) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/signup', { email, otp });
      const { token } = res.data.data;
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true, isLoading: false });
      await get().fetchProfile();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    disconnectSocket();
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/profile');
      set({ user: res.data.data });
    } catch {
      get().logout();
    }
  },

  hasRole: (...roles) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },
}));

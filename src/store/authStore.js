import { create } from 'zustand';
import api from '../services/api'; // We'll create this next

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.msg || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', { email, password });
      set({ isLoading: false });
      return true; // Indicate success for navigation
    } catch (error) {
      set({ error: error.response?.data?.msg || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    set({ token: null, user: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user, isAuthenticated: true });
    }
  }
}));

// Initialize auth state when the app loads
useAuthStore.getState().initializeAuth();

export default useAuthStore;
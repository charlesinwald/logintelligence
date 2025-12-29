import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AuthState, User } from '../types/auth';
import { googleLoginApi, logoutApi, refreshTokenApi, getMeApi } from '../api/auth';

interface AuthActions {
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  setAccessToken: (token: string) => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

interface AuthStore extends AuthState, AuthActions {}

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes

let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

const startTokenRefreshInterval = (refreshFn: () => Promise<string | null>) => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }
  refreshIntervalId = setInterval(async () => {
    try {
      await refreshFn();
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }, TOKEN_REFRESH_INTERVAL);
};

const stopTokenRefreshInterval = () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      setAccessToken: (token: string) => {
        set({ accessToken: token });
      },

      clearError: () => {
        set({ error: null });
      },

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        try {
          const { accessToken } = await refreshTokenApi();
          const { user } = await getMeApi(accessToken);

          set({
            user: { ...user, subscription: user.subscription },
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });

          startTokenRefreshInterval(get().refreshToken);
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      googleLogin: async (credential: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user, subscription, accessToken } = await googleLoginApi(credential);

          set({
            user: { ...user, subscription },
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          startTokenRefreshInterval(get().refreshToken);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        stopTokenRefreshInterval();

        try {
          await logoutApi();
        } catch (error) {
          console.error('Logout error:', error);
        }

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshToken: async () => {
        try {
          const { accessToken } = await refreshTokenApi();
          set({ accessToken });
          return accessToken;
        } catch {
          get().logout();
          return null;
        }
      },
    }),
    { name: 'auth-store' }
  )
);

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

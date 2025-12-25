export interface Subscription {
  tier: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  trialEnd?: number | null;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  subscription?: Subscription;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  subscription: Subscription;
  accessToken: string;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
}

export interface MeResponse {
  success: boolean;
  user: User & { subscription: Subscription };
}

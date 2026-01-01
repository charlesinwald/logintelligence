const API_BASE = '/api/subscriptions';

export interface CheckoutResponse {
  success: boolean;
  sessionId: string;
  url: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  subscription: {
    tier: string;
    status: string;
    current_period_start: number | null;
    current_period_end: number | null;
    trial_end: number | null;
    cancel_at_period_end: boolean;
  };
}

export async function createCheckoutSession(accessToken: string): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Failed to create checkout session');
  }

  return response.json();
}

export async function getSubscriptionStatus(accessToken: string): Promise<SubscriptionStatusResponse> {
  const response = await fetch(`${API_BASE}/status`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get subscription status');
  }

  return response.json();
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  subscription: {
    tier: string;
    status: string;
  };
}

export async function syncSubscription(accessToken: string): Promise<SyncResponse> {
  const response = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sync subscription');
  }

  return response.json();
}

export interface VerifySessionResponse {
  success: boolean;
  subscription: {
    tier: string;
    status: string;
    trial_end: number | null;
  };
}

export async function verifyCheckoutSession(
  accessToken: string,
  sessionId: string
): Promise<VerifySessionResponse> {
  const response = await fetch(`${API_BASE}/verify-session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify session');
  }

  return response.json();
}


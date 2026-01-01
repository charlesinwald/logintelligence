const API_BASE = '/api/credits';

export interface CreditsSummary {
  remaining: number;
  used_today: number;
  daily_limit: number;
  is_pro: boolean;
  resets_at: string;
}

export interface CreditsResponse {
  success: boolean;
  credits: CreditsSummary;
}

export async function getCredits(accessToken: string): Promise<CreditsResponse> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch credits');
  }

  return response.json();
}

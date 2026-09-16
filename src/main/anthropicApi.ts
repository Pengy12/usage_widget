const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';

export interface QuotaWindow {
  utilization: number;
  resets_at: string | null;
}

export interface UsageResponse {
  five_hour: QuotaWindow | null;
  seven_day: QuotaWindow | null;
  seven_day_opus?: QuotaWindow | null;
  seven_day_sonnet?: QuotaWindow | null;
  [key: string]: unknown;
}

export type ApiErrorKind = 'auth_expired' | 'rate_limited' | 'server_error' | 'network_error';

export class UsageApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string) {
    super(message);
  }
}

export async function fetchUsage(token: string, userAgent: string): Promise<UsageResponse> {
  let response: Response;
  try {
    response = await fetch(USAGE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
        'anthropic-beta': 'oauth-2025-04-20',
      },
    });
  } catch (err) {
    throw new UsageApiError('network_error', err instanceof Error ? err.message : 'Network error');
  }

  if (response.status === 401) {
    throw new UsageApiError('auth_expired', 'Claude Code session expired');
  }
  if (response.status === 429) {
    throw new UsageApiError('rate_limited', 'Rate limited by Anthropic API');
  }
  if (!response.ok) {
    throw new UsageApiError('server_error', `Unexpected status ${response.status}`);
  }

  return (await response.json()) as UsageResponse;
}

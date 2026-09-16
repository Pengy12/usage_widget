export interface QuotaSnapshot {
  utilization: number;
  resetsAt: string | null;
}

export interface UsageState {
  status: 'ok' | 'loading' | 'no_credentials' | 'expired' | 'rate_limited' | 'error';
  message: string | null;
  session: QuotaSnapshot | null;
  weekly: QuotaSnapshot | null;
  weeklyOpus: QuotaSnapshot | null;
  weeklySonnet: QuotaSnapshot | null;
  lastUpdated: string | null;
}

export const IPC_USAGE_UPDATE = 'usage:update';
export const IPC_REQUEST_REFRESH = 'usage:refresh';

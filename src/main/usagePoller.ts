import { EventEmitter } from 'node:events';
import { getAccessToken, getUserAgent } from './credentials';
import { fetchUsage, UsageApiError, QuotaWindow } from './anthropicApi';
import { UsageState, QuotaSnapshot } from '../shared/types';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // the usage endpoint 429s if polled too aggressively
const MIN_MANUAL_REFRESH_GAP_MS = 20 * 1000;

function toSnapshot(window: QuotaWindow | null | undefined): QuotaSnapshot | null {
  if (!window) return null;
  return { utilization: window.utilization, resetsAt: window.resets_at };
}

export class UsagePoller extends EventEmitter {
  private state: UsageState = {
    status: 'loading',
    message: null,
    session: null,
    weekly: null,
    weeklyOpus: null,
    weeklySonnet: null,
    lastUpdated: null,
  };

  private timer: NodeJS.Timeout | null = null;
  private lastFetchAt = 0;
  private cachedUserAgent: string | null = null;

  getState(): UsageState {
    return this.state;
  }

  start(): void {
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Manual refresh (e.g. popover opened by the user); throttled to avoid 429s. */
  async requestRefresh(): Promise<void> {
    if (Date.now() - this.lastFetchAt < MIN_MANUAL_REFRESH_GAP_MS) return;
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    this.lastFetchAt = Date.now();
    const { token, error } = await getAccessToken();

    if (!token) {
      this.setState({
        status: error === 'expired' ? 'expired' : 'no_credentials',
        message:
          error === 'expired'
            ? 'Claude Code session expired — run `claude` once to sign back in.'
            : 'No Claude Code login found on this machine.',
      });
      return;
    }

    if (!this.cachedUserAgent) {
      this.cachedUserAgent = await getUserAgent();
    }

    try {
      const usage = await fetchUsage(token, this.cachedUserAgent);
      this.setState({
        status: 'ok',
        message: null,
        session: toSnapshot(usage.five_hour),
        weekly: toSnapshot(usage.seven_day),
        weeklyOpus: toSnapshot(usage.seven_day_opus),
        weeklySonnet: toSnapshot(usage.seven_day_sonnet),
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof UsageApiError) {
        const statusMap: Record<string, UsageState['status']> = {
          auth_expired: 'expired',
          rate_limited: 'rate_limited',
          server_error: 'error',
          network_error: 'error',
        };
        this.setState({ status: statusMap[err.kind] ?? 'error', message: err.message });
      } else {
        this.setState({ status: 'error', message: 'Unknown error fetching usage.' });
      }
    }
  }

  private setState(patch: Partial<UsageState>): void {
    this.state = { ...this.state, ...patch };
    this.emit('update', this.state);
  }
}

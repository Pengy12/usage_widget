// Deliberately no imports here: this file must stay a plain <script> (not an
// ES/CommonJS module) since it runs directly in the sandboxed renderer with
// no module loader. Types are duplicated locally instead of importing from
// ../shared/types.

interface QuotaSnapshot {
  utilization: number;
  resetsAt: string | null;
}

interface UsageState {
  status: 'ok' | 'loading' | 'no_credentials' | 'expired' | 'rate_limited' | 'error';
  message: string | null;
  session: QuotaSnapshot | null;
  weekly: QuotaSnapshot | null;
  weeklyOpus: QuotaSnapshot | null;
  weeklySonnet: QuotaSnapshot | null;
  lastUpdated: string | null;
}

interface Window {
  usageWidget: {
    onUpdate: (callback: (state: UsageState) => void) => void;
    requestRefresh: () => Promise<void>;
  };
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el as T;
}

const messageEl = byId<HTMLDivElement>('message');
const barsEl = byId<HTMLDivElement>('bars');
const updatedEl = byId<HTMLDivElement>('updated');
const refreshBtn = byId<HTMLButtonElement>('refresh');

const sessionPct = byId<HTMLSpanElement>('session-pct');
const sessionFill = byId<HTMLDivElement>('session-fill');
const sessionReset = byId<HTMLDivElement>('session-reset');

const weeklyPct = byId<HTMLSpanElement>('weekly-pct');
const weeklyFill = byId<HTMLDivElement>('weekly-fill');
const weeklyReset = byId<HTMLDivElement>('weekly-reset');

function fillClass(utilization: number): string {
  if (utilization >= 90) return 'bar-fill danger';
  if (utilization >= 70) return 'bar-fill warn';
  return 'bar-fill';
}

function formatResetLabel(resetsAt: string | null): string {
  if (!resetsAt) return '';
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'resets shortly';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `resets in ${diffMin}m`;
  const hours = diffMin / 60;
  if (hours < 36) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `resets in ${h}h ${m}m` : `resets in ${h}h`;
  }
  return `resets ${date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`;
}

function renderQuota(
  quota: QuotaSnapshot | null,
  pctEl: HTMLElement,
  fillEl: HTMLElement,
  resetEl: HTMLElement,
): void {
  if (!quota) {
    pctEl.textContent = '–';
    fillEl.style.width = '0%';
    fillEl.className = 'bar-fill';
    resetEl.textContent = '';
    return;
  }
  const pct = Math.round(quota.utilization);
  pctEl.textContent = `${pct}%`;
  fillEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  fillEl.className = fillClass(pct);
  resetEl.textContent = formatResetLabel(quota.resetsAt);
}

const MESSAGES: Record<string, string> = {
  loading: 'Loading usage…',
  no_credentials: 'Not signed in to Claude Code on this machine.',
  expired: 'Claude Code session expired. Run `claude` once to sign back in.',
  rate_limited: 'Being rate limited by Anthropic — will retry shortly.',
  error: 'Could not fetch usage.',
};

function render(state: UsageState): void {
  const showMessage = state.status !== 'ok';
  messageEl.hidden = !showMessage;
  barsEl.hidden = showMessage;

  if (showMessage) {
    messageEl.textContent = state.message ?? MESSAGES[state.status] ?? 'Unknown state';
  } else {
    renderQuota(state.session, sessionPct, sessionFill, sessionReset);
    renderQuota(state.weekly, weeklyPct, weeklyFill, weeklyReset);
  }

  updatedEl.textContent = state.lastUpdated
    ? `Updated ${new Date(state.lastUpdated).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
    : '';
}

window.usageWidget.onUpdate(render);
refreshBtn.addEventListener('click', () => void window.usageWidget.requestRefresh());

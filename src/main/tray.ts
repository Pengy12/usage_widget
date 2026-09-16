import { Tray, Menu, nativeImage, app } from 'electron';
import { join } from 'node:path';
import { UsageState } from '../shared/types';

function trayIconPath(): string {
  const assetsDir = join(__dirname, '..', '..', 'assets');
  return process.platform === 'darwin' ? join(assetsDir, 'trayTemplate.png') : join(assetsDir, 'tray.png');
}

export function createTray(): Tray {
  const image = nativeImage.createFromPath(trayIconPath());
  const tray = new Tray(image);
  if (process.platform === 'darwin') {
    image.setTemplateImage(true);
  }
  tray.setToolTip('Usage Widget — loading…');
  return tray;
}

function formatResetsAt(resetsAt: string | null): string {
  if (!resetsAt) return '';
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'resets shortly';

  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `resets in ${diffMin}m`;

  const diffHours = diffMin / 60;
  if (diffHours < 36) {
    const h = Math.floor(diffHours);
    const m = Math.round((diffHours - h) * 60);
    return m > 0 ? `resets in ${h}h ${m}m` : `resets in ${h}h`;
  }

  return `resets ${date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`;
}

export function formatTooltip(state: UsageState): string {
  const lines = [`Usage Widget — Claude`];

  switch (state.status) {
    case 'loading':
      lines.push('Loading…');
      break;
    case 'no_credentials':
      lines.push('Not signed in to Claude Code');
      break;
    case 'expired':
      lines.push('Session expired — run `claude` to sign in');
      break;
    case 'rate_limited':
      lines.push('Rate limited, retrying soon…');
      break;
    case 'error':
      lines.push(`Error: ${state.message ?? 'unknown'}`);
      break;
    case 'ok':
      if (state.session) {
        lines.push(`Session: ${Math.round(state.session.utilization)}% (${formatResetsAt(state.session.resetsAt)})`);
      }
      if (state.weekly) {
        lines.push(`Weekly: ${Math.round(state.weekly.utilization)}% (${formatResetsAt(state.weekly.resetsAt)})`);
      }
      break;
  }

  return lines.join('\n');
}

export function buildContextMenu(onRefresh: () => void): Menu {
  return Menu.buildFromTemplate([
    { label: 'Refresh now', click: onRefresh },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
}

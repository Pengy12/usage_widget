import { app, ipcMain, Tray, BrowserWindow } from 'electron';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTray, formatTooltip, buildContextMenu } from './tray';
import { createPopover, positionPopover } from './popoverWindow';
import { UsagePoller } from './usagePoller';
import { IPC_USAGE_UPDATE, IPC_REQUEST_REFRESH, UsageState } from '../shared/types';

/** Default new installs to launching at login, once. If the user later
 * unchecks it from the tray menu, this must never turn it back on. Only
 * macOS/Windows support setLoginItemSettings; it's a no-op on Linux. */
function enableAutostartOnFirstRun(): void {
  const marker = join(app.getPath('userData'), '.autostart-initialized');
  if (existsSync(marker)) return;
  app.setLoginItemSettings({ openAtLogin: true });
  writeFileSync(marker, '');
}

// This popover never uses GPU-accelerated content (no video/canvas/WebGL), so
// the GPU process Electron otherwise spins up is pure idle overhead.
app.disableHardwareAcceleration();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }

  let tray: Tray | null = null;
  let popover: BrowserWindow | null = null;
  const poller = new UsagePoller();

  const pushStateToRenderer = (state: UsageState): void => {
    if (popover && !popover.isDestroyed()) {
      popover.webContents.send(IPC_USAGE_UPDATE, state);
    }
  };

  const togglePopover = (bounds?: Electron.Rectangle): void => {
    if (!tray) return;
    if (popover && popover.isVisible()) {
      popover.hide();
      return;
    }
    // Created lazily on first open rather than at launch, so the app doesn't
    // carry a second renderer process in memory until it's actually used.
    if (!popover) popover = createPopover();
    positionPopover(popover, bounds ?? tray.getBounds());
    popover.show();
    popover.focus();
    pushStateToRenderer(poller.getState());
    void poller.requestRefresh();
  };

  app.on('second-instance', () => togglePopover());

  app.whenReady().then(() => {
    enableAutostartOnFirstRun();
    tray = createTray();

    tray.on('click', (_event, bounds) => togglePopover(bounds));
    tray.on('right-click', () => {
      if (!tray) return;
      tray.popUpContextMenu(buildContextMenu(() => void poller.requestRefresh()));
    });

    poller.on('update', (state: UsageState) => {
      if (tray) tray.setToolTip(formatTooltip(state));
      pushStateToRenderer(state);
    });

    ipcMain.handle(IPC_REQUEST_REFRESH, () => poller.requestRefresh());

    poller.start();
  });

  app.on('window-all-closed', () => {
    // Tray-only app: keep running even with no windows open.
  });
}

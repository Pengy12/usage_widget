import { app, ipcMain, Tray, BrowserWindow } from 'electron';
import { createTray, formatTooltip, buildContextMenu } from './tray';
import { createPopover, positionPopover } from './popoverWindow';
import { UsagePoller } from './usagePoller';
import { IPC_USAGE_UPDATE, IPC_REQUEST_REFRESH, UsageState } from '../shared/types';

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
    if (!tray || !popover) return;
    if (popover.isVisible()) {
      popover.hide();
      return;
    }
    positionPopover(popover, bounds ?? tray.getBounds());
    popover.show();
    popover.focus();
    pushStateToRenderer(poller.getState());
    void poller.requestRefresh();
  };

  app.on('second-instance', () => togglePopover());

  app.whenReady().then(() => {
    tray = createTray();
    popover = createPopover();

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

import { BrowserWindow, Tray, screen } from 'electron';
import { join } from 'node:path';

const WIDTH = 300;
const HEIGHT = 240;

export function createPopover(): BrowserWindow {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '..', 'preload', 'popover-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  void win.loadFile(join(__dirname, '..', 'renderer', 'popover.html'));

  win.on('blur', () => {
    if (!win.webContents.isDevToolsOpened()) win.hide();
  });

  return win;
}

/** Anchors the popover to the tray icon: below it on macOS (menu bar is at the
 * top), above it on Windows/Linux (tray is at the bottom of the screen). */
export function positionPopover(win: BrowserWindow, tray: Tray): void {
  const trayBounds = tray.getBounds();
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const { x: workX, y: workY, width: workWidth, height: workHeight } = display.workArea;

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - WIDTH / 2);
  x = Math.max(workX + 8, Math.min(x, workX + workWidth - WIDTH - 8));

  const trayIsAtTop = trayBounds.y < workY + workHeight / 2;
  const y = trayIsAtTop ? trayBounds.y + trayBounds.height + 4 : trayBounds.y - HEIGHT - 4;

  win.setBounds({ x, y, width: WIDTH, height: HEIGHT });
}

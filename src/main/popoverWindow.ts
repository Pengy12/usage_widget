import { BrowserWindow, Rectangle, screen } from 'electron';
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
      spellcheck: false,
    },
  });

  void win.loadFile(join(__dirname, '..', 'renderer', 'popover.html'));

  win.on('blur', () => {
    if (!win.webContents.isDevToolsOpened()) win.hide();
  });

  // Frameless window has no menu, so wire F12 directly for debugging.
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      win.webContents.toggleDevTools();
    }
  });

  return win;
}

/** tray.getBounds() is unreliable right after the icon is created on Windows
 * (returns an all-zero rect), which sends the popover to the top-left of the
 * screen instead of anchoring it near the tray. Fall back to the cursor
 * position — always accurate, since the user just clicked there. */
function resolveAnchor(bounds: Rectangle): Rectangle {
  const isDegenerate = bounds.x === 0 && bounds.y === 0 && bounds.width === 0 && bounds.height === 0;
  if (!isDegenerate) return bounds;
  const cursor = screen.getCursorScreenPoint();
  return { x: cursor.x, y: cursor.y, width: 0, height: 0 };
}

/** Anchors the popover to the tray icon: below it on macOS (menu bar is at the
 * top), above it on Windows/Linux (tray is at the bottom of the screen). */
export function positionPopover(win: BrowserWindow, trayBounds: Rectangle): void {
  const anchor = resolveAnchor(trayBounds);
  const display = screen.getDisplayNearestPoint({ x: anchor.x, y: anchor.y });
  const { x: workX, y: workY, width: workWidth, height: workHeight } = display.workArea;

  let x = Math.round(anchor.x + anchor.width / 2 - WIDTH / 2);
  x = Math.max(workX + 8, Math.min(x, workX + workWidth - WIDTH - 8));

  const anchorIsAtTop = anchor.y < workY + workHeight / 2;
  const y = anchorIsAtTop ? anchor.y + anchor.height + 4 : anchor.y - HEIGHT - 4;

  win.setBounds({ x, y, width: WIDTH, height: HEIGHT });
}

import { contextBridge, ipcRenderer } from 'electron';
import type { UsageState } from '../shared/types';

// Sandboxed preload scripts (the default since Electron 20) can only require
// electron itself and Node builtins — no local files — so these channel
// names are duplicated from ../shared/types rather than imported.
const IPC_USAGE_UPDATE = 'usage:update';
const IPC_REQUEST_REFRESH = 'usage:refresh';

contextBridge.exposeInMainWorld('usageWidget', {
  onUpdate: (callback: (state: UsageState) => void) => {
    ipcRenderer.on(IPC_USAGE_UPDATE, (_event, state: UsageState) => callback(state));
  },
  requestRefresh: () => ipcRenderer.invoke(IPC_REQUEST_REFRESH),
});

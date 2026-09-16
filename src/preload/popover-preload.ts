import { contextBridge, ipcRenderer } from 'electron';
import { IPC_USAGE_UPDATE, IPC_REQUEST_REFRESH, UsageState } from '../shared/types';

contextBridge.exposeInMainWorld('usageWidget', {
  onUpdate: (callback: (state: UsageState) => void) => {
    ipcRenderer.on(IPC_USAGE_UPDATE, (_event, state: UsageState) => callback(state));
  },
  requestRefresh: () => ipcRenderer.invoke(IPC_REQUEST_REFRESH),
});

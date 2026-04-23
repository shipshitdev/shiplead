import type { ShipleadDesktopAPI } from '@shiplead/shared';
import { contextBridge, ipcRenderer } from 'electron';

const api: ShipleadDesktopAPI = {
  getApiBaseUrl: async () => ipcRenderer.invoke('app:get-api-base-url'),
  openExternal: async (url: string) => {
    await ipcRenderer.invoke('app:open-external', url);
  },
};

contextBridge.exposeInMainWorld('shiplead', api);

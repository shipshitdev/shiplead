import path from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { ApiServiceManager, resolveDesktopRoots } from './api-service';

app.setName('Shiplead');

const DIST = path.join(__dirname, '..');
const { desktopRoot, repoRoot } = resolveDesktopRoots(__dirname);

let apiService: ApiServiceManager | null = null;

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#050607',
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(DIST, 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(path.join(__dirname, '../index.html'));
  }

  window.once('ready-to-show', () => {
    window.show();
  });

  return window;
}

app.whenReady().then(() => {
  apiService = new ApiServiceManager({
    desktopRoot,
    repoRoot,
    userDataPath: app.getPath('userData'),
  });

  ipcMain.handle('app:get-api-base-url', async () => {
    if (!apiService) {
      throw new Error('API service not initialized');
    }
    return apiService.getApiBaseUrl();
  });

  ipcMain.handle('app:open-external', async (_event, url: string) => {
    await shell.openExternal(url);
  });

  void apiService.getApiBaseUrl().catch((error) => {
    console.error('[shiplead-api] failed to start local API:', error);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  apiService?.stop();
});

app.on('window-all-closed', () => {
  apiService?.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

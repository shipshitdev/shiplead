import type { ShipleadDesktopAPI } from '@shiplead/shared';

declare global {
  interface Window {
    shiplead: ShipleadDesktopAPI;
  }
}

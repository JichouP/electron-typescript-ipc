import { GetApiType, ipcMain } from './index';

export type Api = GetApiType<
  {
    getDataFromStore: (str: string) => Promise<string>;
  },
  {
    showAlert: (text: string, num: number) => Promise<void>;
  }
>;

import { contextBridge, ipcRenderer, GetApiType } from './index';

export type Api = GetApiType<
  {
    getDataFromStore: (str: string) => Promise<string>;
  },
  {
    showAlert: (text: string, num: number) => Promise<void>;
  }
>;

const api: Api = {
  invoke: {
    getDataFromStore: async (key: string) => {
      return await ipcRenderer.invoke<Api>('getDataFromStore', key);
    },
  },
  on: {
    showAlert: (listener) => {
      ipcRenderer.on<Api>('showAlert', listener);
    },
  },
};

contextBridge.exposeInMainWorld('myAPI', api);

declare global {
  interface Window {
    myAPI: Api;
  }
}

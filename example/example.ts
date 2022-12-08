// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, GetApiType } from '../src/index';

export type Api = GetApiType<
  {
    a: (str: string) => Promise<string>;
    b: (str: string) => Promise<number>;
  },
  {
    c: (text: string) => Promise<void>;
    d: (text: number) => Promise<void>;
  }
>;

const api: Api = {
  invoke: {
    a: async (key: string) => {
      return await ipcRenderer.invoke<Api, 'a'>('a', key);
    },
    b: async (key: string) => {
      return await ipcRenderer.invoke<Api, 'b'>('b', key);
    },
  },
  on: {
    c: listener => {
      ipcRenderer.on<Api, 'c'>('c', listener);
    },
    d: listener => {
      ipcRenderer.on<Api, 'd'>('d', listener);
    },
  },
};

contextBridge.exposeInMainWorld('myAPI', api);

declare global {
  interface Window {
    myAPI: Api;
  }
}

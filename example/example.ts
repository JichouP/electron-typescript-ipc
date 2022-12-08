// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, GetApiType, createIpcRenderer } from '../src/index';

export type Api = GetApiType<
  {
    a: (str: string) => Promise<string>;
    b: (str: number) => Promise<number>;
  },
  {
    c: (text: string) => Promise<void>;
    d: (text: number) => Promise<void>;
  }
>;

const ipcRenderer = createIpcRenderer<Api>();

const api: Api = {
  invoke: {
    a: async (key: string) => {
      return await ipcRenderer.invoke('a', key);
    },
    b: async (key: number) => {
      return await ipcRenderer.invoke('b', key);
    },
  },
  on: {
    c: listener => {
      ipcRenderer.on('c', listener);
    },
    d: listener => {
      ipcRenderer.on('d', listener);
    },
  },
};

contextBridge.exposeInMainWorld('myAPI', api);

declare global {
  interface Window {
    myAPI: Api;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  contextBridge as originalContextBridge,
  ipcMain as originalIpcMain,
  ipcRenderer as originalIpcRenderer,
  IpcRendererEvent,
  IpcMainInvokeEvent,
  BrowserWindow,
} from 'electron';

export type GetApiType<
  FromRenderer extends Record<string, (...args: any[]) => Promise<any>>,
  FromMain extends Record<string, (...args: any[]) => Promise<any>>,
> = {
  invoke: FromRenderer;
  on: {
    [K in keyof FromMain]: (
      listener: (
        event: IpcRendererEvent,
        ...args: Parameters<FromMain[K]>
      ) => void,
      __originalFunction?: FromMain[K],
    ) => void;
  };
};

type Api = GetApiType<Record<string, any>, Record<string, any>>;

/**
 * @example
 * import { contextBridge, ipcRenderer, GetApiType } from 'electron-typescript-ipc';
 *
 * export type Api = GetApiType<
 *   {
 *     getDataFromStore: (str: string) => Promise<string>;
 *   },
 *   {
 *     showAlert: (text: string, num: number) => Promise<void>;
 *   }
 * >;
 *
 * const api: Api = {
 *   invoke: {
 *     getDataFromStore: async (key: string) => {
 *       return await ipcRenderer.invoke<Api>('getDataFromStore', key);
 *     },
 *   },
 *   on: {
 *     showAlert: (listener) => {
 *       ipcRenderer.on<Api>('showAlert', listener);
 *     },
 *   },
 * };
 *
 * contextBridge.exposeInMainWorld('myAPI', api);
 *
 * declare global {
 *   interface Window {
 *     myAPI: Api;
 *   }
 * }
 */
export const contextBridge = {
  exposeInMainWorld: <T extends GetApiType<any, any>>(
    apiKey: string,
    api: T,
  ) => {
    originalContextBridge.exposeInMainWorld(apiKey, api);
  },
};

export const ipcRenderer = {
  /**
   * @example
   * window.myAPI.invoke.getDataFromStore('Test').then(console.log);
   */
  invoke: <T extends Api>(
    channel: keyof T['invoke'],
    ...args: Parameters<T['invoke'][keyof T['invoke']]>
  ): Promise<ReturnType<T['invoke'][keyof T['invoke']]>> => {
    return originalIpcRenderer.invoke(channel as string, ...args);
  },
  /**
   * @example
   * window.myAPI.on.showAlert(console.log);
   */
  on<T extends Api>(
    channel: keyof T['on'],
    listener: (
      event: IpcRendererEvent,
      ...args: Parameters<Parameters<T['on'][keyof T['on']]>['1']>
    ) => void,
  ): void {
    originalIpcRenderer.on(
      channel as string,
      (event: IpcRendererEvent, ...args: unknown[]) => {
        listener(
          event,
          ...(args as Parameters<Parameters<T['on'][keyof T['on']]>['1']>),
        );
      },
    );
  },
  removeListener<T extends Api>(
    channel: keyof T['on'],
    listener: (...args: unknown[]) => void,
  ): void {
    originalIpcRenderer.removeListener(channel as string, listener);
  },
};

export const ipcMain = {
  /**
   * @example
   * ipcMain.handle<Api>('getDataFromStore', async (_, str) => {
   *   return str;
   * });
   */
  handle<T extends Api>(
    channel: keyof T['invoke'],
    listener: (
      event: IpcMainInvokeEvent,
      ...args: Parameters<T['invoke'][keyof T['invoke']]>
    ) => ReturnType<T['invoke'][keyof T['invoke']]>,
  ): void {
    originalIpcMain.handle(
      channel as string,
      (event: IpcMainInvokeEvent, ...args: unknown[]) => {
        return listener(
          event,
          ...(args as Parameters<T['invoke'][keyof T['invoke']]>),
        );
      },
    );
  },

  /**
   * @example
   * ipcMain.send<Api>(mainWindow, 'showAlert', 'Hello World');
   */
  send<T extends Api>(
    window: BrowserWindow,
    channel: keyof T['on'],
    ...args: Parameters<Parameters<T['on'][keyof T['on']]>['1']>
  ): void {
    window.webContents.send(channel as string, ...args);
  },

  removeHandler<T extends Api>(channel: keyof T['invoke']): void {
    originalIpcMain.removeHandler(channel as string);
  },
};

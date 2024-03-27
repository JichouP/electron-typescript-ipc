/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  contextBridge as originalContextBridge,
  ipcMain as originalIpcMain,
  ipcRenderer as originalIpcRenderer,
  IpcRendererEvent,
  IpcMainInvokeEvent,
  BrowserWindow,
} from 'electron';

type IpcRenderer<T extends Api> = {
  invoke<K extends keyof T['invoke']>(
    channel: K,
    ...args: Parameters<T['invoke'][K]>
  ): Promise<ReturnType<T['invoke'][K]>>;
  on<T extends Api, K extends keyof T['on']>(
    channel: K,
    listener: (...args: Parameters<Parameters<T['on'][K]>['0']>) => void,
  ): void;
  addEventListener<T extends Api, K extends keyof T['on']>(
    channel: K,
    listener: (...args: Parameters<Parameters<T['on'][K]>['0']>) => void,
  ): void;
  removeListener<T extends Api>(
    channel: keyof T['on'],
    listener: (...args: unknown[]) => void,
  ): void;
  off<T extends Api>(
    channel: keyof T['on'],
    listener: (...args: unknown[]) => void,
  ): void;
};

export const createIpcRenderer = <T extends Api>() =>
  originalIpcRenderer as unknown as IpcRenderer<T> & typeof originalIpcRenderer;

type IpcMain<T extends Api> = {
  handle<K extends keyof T['invoke']>(
    channel: K,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: Parameters<T['invoke'][K]>
    ) => ReturnType<T['invoke'][K]>,
  ): void;
  handleOnce<K extends keyof T['invoke']>(
    channel: K,
    listener: (
      event: IpcMainInvokeEvent,
      ...args: Parameters<T['invoke'][K]>
    ) => ReturnType<T['invoke'][K]>,
  ): void;
  send<K extends keyof T['on']>(
    window: BrowserWindow,
    channel: K,
    ...args: Tail<Parameters<Parameters<T['on'][K]>['0']>>
  ): void;
  removeHandler<T extends Api>(channel: keyof T['invoke']): void;
};

export const createIpcMain = <T extends Api>() =>
  ({
    ...originalIpcMain,
    send<T extends Api, K extends keyof T['on']>(
      window: BrowserWindow,
      channel: K,
      ...args: Tail<Parameters<Parameters<T['on'][K]>['0']>>
    ): void {
      window.webContents.send(channel as string, ...args);
    },
  } as unknown as IpcMain<T> & typeof originalIpcMain);

type Tail<T extends unknown[]> = T extends [any, ...infer Rest] ? Rest : [];

type UnknownFunction = (...args: any) => unknown;

type IpcRendererListener<Args extends UnknownFunction> = (
  event: IpcRendererEvent,
  ...args: Parameters<Args>
) => void;

export type GetApiType<T, S extends Record<string, UnknownFunction>> = {
  invoke: T;
  on: {
    [K in keyof S]:
      /**
       * Subscribe message channel from the main process
       * @param listener The callback to handle messages from main process 
       * @return An optional callback to unsubscribe
       */
      (listener: IpcRendererListener<S[K]>) => (void | (() => void))
  };
};

type Api = GetApiType<Record<string, any>, Record<string, any>>;

/**
 * @example
 * import { contextBridge, createIpcRenderer, GetApiType } from 'electron-typescript-ipc';
 *
 * const ipcRenderer = createIpcRenderer<Api>();
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
 *       return await ipcRenderer.invoke('getDataFromStore', key);
 *     },
 *   },
 *   on: {
 *     showAlert: (listener) => {
 *       ipcRenderer.on('showAlert', listener);
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

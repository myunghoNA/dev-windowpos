import { IpcRendererEvent } from 'electron';

/**
 * @description IPC통신 공통 콜백
 */
export type TcomCallback = (event: IpcRendererEvent, ...args: any[]) => void;

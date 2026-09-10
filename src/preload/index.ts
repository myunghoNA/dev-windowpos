import { contextBridge } from 'electron';

import { API_KEY, IPC_API } from '@preload/ipc-renderer.listener';

export type ExposedInMainWorld = Readonly<typeof IPC_API>;

  /**
   * The "Main World" is the JavaScript context that your main renderer code runs in.
   * By default, the page you load in your renderer executes code in this world.
   *
   * @see https://www.electronjs.org/docs/api/context-bridge
   */
 contextBridge.exposeInMainWorld(API_KEY, IPC_API);
 
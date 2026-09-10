import { ipcRenderer, IpcRendererEvent } from 'electron';

import { TcomCallback } from '@preload/ipc-types';
import { MAIN_CHANNEL, RENDERER_CHANNEL } from '@shared/constants';
import {
  AppControlType,
  ComResponseType,
  CurrentSession,
  LangType,
  NotificationInfo,
  PrinterSendItem,
  WindowControlType,
} from '@shared/types';

const API_KEY = 'electron';


/** 
 * @private
 * @name createSubscription
 * @description 메인 프로세스로부터 유입되는 IPC 비동기 이벤트를 구독하고, 
 * 리액트 useEffect 단에서 좀비 리스너를 방지하기 위한 소멸 클린업 함수를 동적 반환
 */
const createSubscription = (channel: string) => (callback: TcomCallback) => {
  const subscription = (event: IpcRendererEvent, ...args: any[]) => callback(event, ...args);
  ipcRenderer.on(channel, subscription);

  // 리스너를 제거하는 클린업 함수를 반환 (React useEffect에서 바로 return 가능)
  return () => {
    ipcRenderer.removeListener(channel, subscription);
  };
};

/**
 * @name IPC_API
 * @description 렌더러 커스텀 윈도우(window.electron)에 노출될 안전 브릿지 API 브랜치 (Readonly)
 */
const IPC_API = {
  versions: process.versions,

  // ===========================================
  // RabbitMQ
  // ===========================================
  rabbitmq: {

    /**
     * @name onConsumeMessage
     * @channels MAIN_CHANNEL.rabbitmq.sendConsumeMessage (Main -> Render)
     */
    onConsumeMessage: createSubscription(MAIN_CHANNEL.rabbitmq.sendConsumeMessage),

    /**
     * @name onConnectStatus
     * @channels MAIN_CHANNEL.rabbitmq.sendConsumeMessage (Main -> Render)
     */
    onConnectStatus: createSubscription(MAIN_CHANNEL.rabbitmq.sendConnectStatus),

    /**
     * @name connectRabbitmq
     * @channels RENDERER_CHANNEL.rabbitmq.connect (Render <-> Main)
     */
    connectRabbitmq: (session:CurrentSession ): Promise<ComResponseType> => {
       return ipcRenderer.invoke(RENDERER_CHANNEL.rabbitmq.connect,  session);
    },

    /**
     * @name disConnectRabbitmq
     * @channels RENDERER_CHANNEL.rabbitmq.disconnect (Render <-> Main)
     */
    disConnectRabbitmq: (): Promise<ComResponseType> => {
       return ipcRenderer.invoke(RENDERER_CHANNEL.rabbitmq.disconnect );
    },

  },

  // ===========================================
  // 공통 인프라 및 시스템 관리 채널
  // ===========================================
  common: {
    /**
     * @name onMainLog
     * @channels MAIN_CHANNEL.common.sendLog (Main -> Render)
     */
    onMainLog: createSubscription(MAIN_CHANNEL.common.sendLog),

    /**
     * @name onAppUpdateCheck
     * @channels MAIN_CHANNEL.common.sendAppUpdateCheck (Main -> Render)
     */
    onAppUpdateCheck: createSubscription(MAIN_CHANNEL.common.sendAppUpdateCheck),

    /**
     * @name onAppUpdateProgress
     * @channels MAIN_CHANNEL.common.sendAppUpdateProgress (Main -> Render)
     */
    onAppUpdateProgress: createSubscription(MAIN_CHANNEL.common.sendAppUpdateProgress),

    /**
     * @name getUpdateInfoAndProvider
     * @channels RENDERER_CHANNEL.common.getUpdateInfoAndProvider (Render <-> Main)
     */
    getUpdateInfoAndProvider: () => ipcRenderer.invoke(RENDERER_CHANNEL.common.getUpdateInfoAndProvider),

    /**
     * @name getSystemInfo
     * @channels RENDERER_CHANNEL.common.getSystemInfo (Render <-> Main)
     */
    getSystemInfo: () => ipcRenderer.invoke(RENDERER_CHANNEL.common.getSystemInfo),

    /**
     * @name getIsOpenPortCheck
     * @channels RENDERER_CHANNEL.common.getIsOpenPortCheck (Render <-> Main)
     */
    getIsOpenPortCheck: async (payload: { checkPort: number | string }): Promise<ComResponseType> => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.common.getIsOpenPortCheck, payload);
    },

    /**
     * @name getIpcRendererReport
     * @channels eventNames, listenerCount (Local Monitoring)
     */
    getIpcRendererReport: () => {
      const channels = ipcRenderer.eventNames();
      const report = channels.map(ch => ({
        channel: ch,
        count: ipcRenderer.listenerCount(ch as string),
      }));
      console.table(report);
      return report;
    },

    /**
     * @name getIpcMainReport
     * @channels RENDERER_CHANNEL.common.getIpcMainReport (Render <-> Main)
     */
    getIpcMainReport: async (): Promise<any>  => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.common.getIpcMainReport);
    },

    /**
     * @name getAppUpdateCheck
     * @channels RENDERER_CHANNEL.common.getAppUpdateCheck (Render <-> Main)
     */
    getAppUpdateCheck: async (): Promise<ComResponseType>  => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.common.getAppUpdateCheck);
    },
    
    /**
     * @name sendAppControlAction
     * @channels RENDERER_CHANNEL.common.sendAppControlAction (Render -> Main)
     */
    sendAppControlAction: (controlId: AppControlType) => {
      ipcRenderer.invoke(RENDERER_CHANNEL.common.sendAppControlAction,  controlId );
    },

    /**
     * @name sendSetLangType
     * @channels RENDERER_CHANNEL.common.sendSetLangType (Render -> Main)
     */
    sendSetLangType: (langType: LangType) => {
      ipcRenderer.invoke(RENDERER_CHANNEL.common.sendSetLangType,  langType );
    },

  },

  
  // ===========================================
  // 하드웨어 영수증 및 주방 프린터 관리 채널
  // ===========================================
  printer: {

    /**
     * @name onPrinterStatus
     * @channels MAIN_CHANNEL.printer.sendPrinterStatus (Main -> Render)
     */
    onPrinterStatus: createSubscription(MAIN_CHANNEL.printer.sendPrinterStatus),

    /**
     * @name getSerialPorts
     * @channels RENDERER_CHANNEL.printer.getSerialPort (Render <-> Main)
     */
    getSerialPorts: async (): Promise<ComResponseType> => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.printer.getSerialPorts);
    },

    /**
     * @name getWindowPrinters
     * @channels RENDERER_CHANNEL.printer.getWindowPrinters (Render <-> Main)
     */
    getWindowPrinters: async (): Promise<ComResponseType> => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.printer.getWindowPrinters);
    },

    /**
     * @name sendToPrinter
     * @channels RENDERER_CHANNEL.printer.sendToPrinter (Render <-> Main)
     */
    sendToPrinter: (payload: PrinterSendItem) => ipcRenderer.invoke(RENDERER_CHANNEL.printer.sendToPrinter, payload),

  },


  // ===========================================
  // 고객 듀얼 모니터 전면 DID 스크린 채널
  // ===========================================
  did: {

    /**
     * @name sendDidControlAction
     * @channels RENDERER_CHANNEL.did.sendDidControlAction (Render -> Main)
     */
    sendDidControlAction: (controlId: WindowControlType) => {
      ipcRenderer.invoke(RENDERER_CHANNEL.did.sendDidControlAction, controlId);
    },
  },


  // ===========================================
  // 실시간 마감 및 주문 배달 알림 채널
  // ===========================================
  alarm: {

    /**
     * @name onGoPage
     * @channels MAIN_CHANNEL.alarm.sendGoPage (Main -> Render)
     */
    onGoPage: createSubscription(MAIN_CHANNEL.alarm.sendGoPage),

    /**
     * @name sendNotification
     * @channels RENDERER_CHANNEL.alarm.sendNotification (Render -> Main)
     */
    sendNotification: (notificationItem: NotificationInfo) => {
      ipcRenderer.invoke(RENDERER_CHANNEL.alarm.sendNotification, notificationItem);
    },
  },


  // ===========================================
  // OS 상주용 실시간 미니 위젯 채널
  // ===========================================
  widget: {

    /**
     * @name sendWidgetControlAction
     * @channels RENDERER_CHANNEL.widget.sendWidgetControlAction (Render -> Main)
     */
    sendWidgetControlAction: (controlId: WindowControlType) => {
      ipcRenderer.invoke(RENDERER_CHANNEL.widget.sendWidgetControlAction, controlId);
    },
  },


  // ===========================================
  // 웹뷰 관리 채널
  // ===========================================
  webview: {
    
    /**
     * @name sendLoadView
     * @channels RENDERER_CHANNEL.webview.sendLoadView (Render -> Main)
     */
    sendLoadView: (webviewUrl: string) => {
      ipcRenderer.invoke(RENDERER_CHANNEL.webview.sendLoadView, webviewUrl);
    },

    /**
     * @name sendSetBounds
     * @channels RENDERER_CHANNEL.webview.sendSetBounds (Render -> Main)
     */
    sendSetBounds: (bounds: Electron.Rectangle) => {
      ipcRenderer.invoke(RENDERER_CHANNEL.webview.sendSetBounds, bounds);
    },

    /**
     * @name sendHideView
     * @channels RENDERER_CHANNEL.webview.sendHideView (Render -> Main)
     */
    sendHideView: () => {
      ipcRenderer.invoke(RENDERER_CHANNEL.webview.sendHideView);
    },

  },

  // ===========================================
  // ZATCA 관리 채널
  // ===========================================
  zatca: {

    /**
     * @name requestCsid
     * @channels RENDERER_CHANNEL.zatca.requestCsid (Render <-> Main)
     */
    requestCsid: async (): Promise<ComResponseType> => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.zatca.requestCsid);
    },

    /**
     * @name requestInvoiceCheck
     * @channels RENDERER_CHANNEL.zatca.requestInvoiceCheck (Render <-> Main)
     */
    requestInvoiceCheck: async (): Promise<ComResponseType> => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.zatca.requestInvoiceCheck);
    },

    /**
     * @name complianceInvoice
     * @channels RENDERER_CHANNEL.zatca.complianceInvoice (Render <-> Main)
     */
    complianceInvoice: async (certData:any, invoiceData:any): Promise<ComResponseType> => {
      return ipcRenderer.invoke(RENDERER_CHANNEL.zatca.complianceInvoice, certData, invoiceData);
    },

  },

} as const;


export { API_KEY, IPC_API };


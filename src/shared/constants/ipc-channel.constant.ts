
/**
 * @name RENDERER_CHANNEL
 * @description [Renderer -> Main] 렌더러(프론트엔드)에서 메인 프로세스를 향해 Invoke/Send 요청 때 
 *              사용하는 단방향 및 양방향 IPC 채널 키 셋
 */
export const RENDERER_CHANNEL = {
    
    // ===========================================
    // RabbitMQ 
    // ===========================================
    rabbitmq: {
      connect: 'rabbitmq:connect' ,
      disconnect: 'rabbitmq:disconnect' ,
    },

    // ===========================================
    // 공통 인프라 및 시스템
    // ===========================================
    common: {
      getUpdateInfoAndProvider: 'common:get-update-info-and-provider' ,
      getSystemInfo: 'common:get-system-info' ,
      getIsOpenPortCheck: 'common:get-is-open-port-check',
      getAppUpdateCheck: 'common:get-app-update-check',
      getIpcMainReport: 'common:get-ipc-main-report',
      sendAppControlAction: 'common:send-app-control-action',
      sendSetLangType: 'common:send-set-lang-type',
    },

    // ===========================================
    // 하드웨어 시리얼 프린터
    // ===========================================
    printer: {
       getSerialPorts: 'printer:get-serial-ports',
       getWindowPrinters: 'printer:get-window-printers',
       sendToPrinter: 'printer:send-to-printer',
    },

    // ===========================================
    // 고객 대면 듀얼 DID 스크린
    // ===========================================
    did: {
       sendDidControlAction: 'did:send-did-control-action',
    },

    // ===========================================
    // 매장 실시간 주문/마감 알림
    // ===========================================
    alarm: {
       sendNotification: 'alarm:send-notification',
    },

    // ===========================================
    // OS 상주용 미니 매출 위젯
    // ===========================================
    widget: {
       sendWidgetControlAction: 'widget:send-widget-control-action',
    },

    // ===========================================
    // 웹뷰 관련 도메인
    // ===========================================
    webview: {
       sendLoadView: 'webview:send-load-view',
       sendSetBounds: 'webview:send-set-bounds',
       sendHideView: 'webview:send-hide-view',
    },
    // ===========================================
    // ZATCA 관련
    // ===========================================
    zatca: {
       requestCsid: 'zatca:request-csid',
       requestInvoiceCheck: 'zatca:request-invoice-check',

       complianceInvoice: 'zatca:compliance-invoice',
    },
} as const;

  
/**
 * @name MAIN_CHANNEL
 * @description [Main -> Renderer] 메인 프로세스(백엔드)에서 가동 중인 렌더러 창들을 향해 
 *              단방향(Broadcast/On)으로 이벤트를 송신 때 사용하는 IPC 채널 키 셋
 */
export const MAIN_CHANNEL = {

    // ===========================================
    // RabbitMQ 
    // ===========================================
    rabbitmq: {
      sendConsumeMessage: 'rabbitmq:send-consume-message' ,
      sendConnectStatus: 'rabbitmq:send-connect-status' ,
    },

  // ===========================================
  // 공통 로그 및 업데이트 모니터링 스트림
  // ===========================================
  common: {
    sendLog: 'common:send-log' ,
    sendAppUpdateCheck: 'common:send-app-update-check' ,
    sendAppUpdateProgress: 'common:send-app-update-progress' ,
  },

  // ===========================================
  // 물리 영수증 프린터 상태 감지 스트림
  // ===========================================
  printer: {
    sendPrinterStatus: 'printer:send-printer-status' ,
  },

  // ===========================================
  // 페이지 라우터 강제 제어 스트림
  // ===========================================
  alarm: {
    sendGoPage: 'alarm:send-go-page' ,
  },
} as const;
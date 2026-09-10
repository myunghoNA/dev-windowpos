import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';

// Import Redux
import store from '@renderer/redux/store';
// Import Hooks
import { useAppUpdateProcess, useOnMainLog, useOnPrinterStatus } from '@renderer/common/hooks/init-ipcmain.hook';
import { useStorageInit } from '@renderer/common/hooks/init-storage.hook';
import { useMemoryCheck } from '@renderer/common/hooks/memory-check.hooks';
import { useNetworkMonitorInit } from '@renderer/common/hooks/network-check.hooks';
// Import Helper
import { customLogger } from '@renderer/common/helpers';
import '@renderer/common/helpers/i18n.helper';
// Import Components
import { ErrorBoundary } from '@renderer/components/common/ErrorBoundary';
import HeaderFrame from '@renderer/components/common/HeaderFrame';
import { RouterView } from '@renderer/pages/RouterView';
// Import Css
import '@renderer/assets/scss/App.scss';

 const LOG_TITLE  = '[renderer.main]';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);


/**
 * @name App
 * @description 앱 루트 컴포넌트
 */
export default function App(): JSX.Element {

  customLogger.info(`${LOG_TITLE}`, '프로그램 시작');
  //# 앱 전체의 메모리 누수를 감시
  useMemoryCheck();

  //# 멀티 윈도우 인스턴스 판별 파라미터 확인
  const windowType = new URLSearchParams(window.location.search).get('windowType') 
    || new URLSearchParams(window.location.hash.split('?')[1] || '').get('windowType');
  const isSubWindow  = windowType === 'widget' || windowType === 'did';

  //# 브라우저 저장소 영구 보존 권한 설정
  useStorageInit();
  //# 메인 프로세스 일반 로그 수신
  useOnMainLog();
  //# 프린터 상태 메시지 수신 - 로그 + 알림
  useOnPrinterStatus();
  //# 네트워크 상태추적
  useNetworkMonitorInit();


  // 업데이트 확인 후 실행
  // TODO: 추후 대상자만 받도록
  const isAutoUpdate = true;
  if(isAutoUpdate) {
    useAppUpdateProcess();
  }else{
    customLogger.info(`${LOG_TITLE}`, '자동 업데이트 대상에서 제외됨.'); 
  }

  // 이동페이지 수신
  // useOnGoPage();

  return (
      <div id='app'>
        {/* 헤더프레임 영역 */}
           {!isSubWindow && <HeaderFrame/>}
        {/* <HeaderFrame/> */}
        {/* 사이드바 영역 */}
        {/* 라우터 영역 */}
        <RouterView />
      </div>
  );
}

// 새로고침하거나 앱을 종료해도 store가 리셋되는 것을 방지
export const globalPersistStore = persistStore(store); 

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <Provider store={store}>
                <PersistGate loading={null} persistor={globalPersistStore}>
                    <HashRouter
                        future={{
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }}
                    >
                        <App />
                    </HashRouter>
                </PersistGate>
            </Provider>
        </ErrorBoundary>
    </React.StrictMode>,
);
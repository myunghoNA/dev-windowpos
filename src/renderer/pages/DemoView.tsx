import React, { useState } from 'react';

import { DemoApiCall } from '@renderer/pages/demo/DemoApiCall';
import DemoCalendar from '@renderer/pages/demo/DemoCalendar';
import { DemoDataProcess } from '@renderer/pages/demo/DemoDataProcess';
import { DemoFunctionCall } from '@renderer/pages/demo/DemoFunctionCall';
import { DemoIndexDB } from '@renderer/pages/demo/DemoIndexDB';
import { DemoIpcMain } from '@renderer/pages/demo/DemoIpcMain';
import { DemoMultiLang } from '@renderer/pages/demo/DemoMultiLang';
import { DemoPerfomance } from '@renderer/pages/demo/DemoPerfomance';
import { DemoPrinterPreView } from '@renderer/pages/demo/DemoPrinterPreView';
import { DemoSettingNotification } from '@renderer/pages/demo/DemoSettingNotification';
import { DemoSettingPrinter } from '@renderer/pages/demo/DemoSettingPrinter';
import { DemoWebView } from '@renderer/pages/demo/DemoWebView';
import { DemoZataca } from '@renderer/pages/demo/DemoZataca';

export function DemoView() {
  const [activeTab, setActiveTab] = useState('SETTING_PRINTER');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 좌측 사이드바 */}
      <aside style={{ width: '250px', background: '#f4f4f4', padding: '20px' }}>
        <h3>Demo Samples</h3>
        <ul>
          <li onClick={() => setActiveTab('SETTING_PRINTER')}>프린터설정</li>
          <li onClick={() => setActiveTab('SETTING_NOTIFICATION')}>알림설정</li>

          <li onClick={() => setActiveTab('IPC_MAIN')}>메인통신</li>
          <li onClick={() => setActiveTab('API_CALL')}>API CALL</li>
          <li onClick={() => setActiveTab('FUNCTION_CALL')}>FUNCTION CALL</li>
          <li onClick={() => setActiveTab('PRINTER_PREVIEW')}>주문서미리보기</li>
          <li onClick={() => setActiveTab('CALENDAR_PREVIEW')}>예약</li>
          <li onClick={() => setActiveTab('INDEX_DB')}>indexDB</li>
          <li onClick={() => setActiveTab('MULTI_LANGUAGE')}>다국어</li>
          <li onClick={() => setActiveTab('DATA_PROCESS')}>데이터처리</li>
          <li onClick={() => setActiveTab('PERFORMANCE')}>최적화</li>
          <li onClick={() => setActiveTab('WEBVIEW')}>webview</li>
          <li onClick={() => setActiveTab('ZATACA')}>ZATACA</li>

          {/* 추가 샘플 리스트 */}
        </ul>
      </aside>

      {/* 우측 상세 영역 */}
      <main style={{ flex: 1, padding: '40px' }}>
        {activeTab === 'IPC_MAIN' && <DemoIpcMain />}
        {activeTab === 'API_CALL' && <DemoApiCall />}
        {activeTab === 'FUNCTION_CALL' && <DemoFunctionCall />}
        {activeTab === 'PRINTER_PREVIEW' && <DemoPrinterPreView />}
        {activeTab === 'CALENDAR_PREVIEW' && <DemoCalendar />}
        {activeTab === 'INDEX_DB' && <DemoIndexDB />}
        {activeTab === 'MULTI_LANGUAGE' && <DemoMultiLang />}
        {activeTab === 'DATA_PROCESS' && <DemoDataProcess />}
        {activeTab === 'PERFORMANCE' && <DemoPerfomance />}
        {activeTab === 'WEBVIEW' && <DemoWebView />}
        {activeTab === 'ZATACA' && <DemoZataca />}

        {activeTab === 'SETTING_PRINTER' && <DemoSettingPrinter />}
        {activeTab === 'SETTING_NOTIFICATION' && <DemoSettingNotification />}
      </main>
    </div>
  );
}


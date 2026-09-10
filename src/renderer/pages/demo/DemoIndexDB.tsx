import React, { useState } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';
// Import Hooks
import { usePagePerformance } from '@renderer/common/hooks';
import { getSettingPrinters } from '@renderer/common/repositories/setting-printer.repository';


export function DemoIndexDB() {

  const LOG_TITLE  = 'DemoIndexDB';
  // 성능측정
  usePagePerformance(LOG_TITLE);

  const [logs, setLogs] = useState<string>('');

  // 프린터설정 리스트
  const settingPrinterList = useLiveQuery(() => getSettingPrinters(), []) ?? [];

  /** 조회 */
  const handleSearch = async () => {

    const result = `-------------- 전체프린터설정  \n 
              ${JSON.stringify(settingPrinterList, null, 2)} \n 
            -------------- 1개프린터  \n 
              ${JSON.stringify(settingPrinterList.length > 0 ? settingPrinterList[0] : [], null, 2)}`;

    setLogs(result);
  };


  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2>INDEX DB테스트</h2>
      
      {/* 버튼 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
        <button onClick={() => setLogs('')}>로그 초기화</button>
        <button onClick={ () => handleSearch() }>프린터1개조회</button>
      </div>

      {/* 결과 표시 영역 */}
      <textarea
        value={logs}
        readOnly
        style={{
          width: '100%',
          height: '500px',
          padding: '10px',
          fontFamily: 'monospace',
          backgroundColor: '#222',
          color: '#0f0',
          borderRadius: '5px',
        }}
      />
    </div>
  );
}

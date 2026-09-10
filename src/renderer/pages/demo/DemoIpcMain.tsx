import React, { useEffect, useState } from 'react';

import { needElectron } from '@renderer/apis/need-electron.api';
// Import Hooks
import { usePagePerformance } from '@renderer/common/hooks';
//# Import Type
import { ComResponseType, SystemInfo } from '@shared/types';
//# Import Helper

export function DemoIpcMain() {
 
  const LOG_TITLE  = 'DemoIpcMain';
  // 성능측정
  usePagePerformance(LOG_TITLE);

  const [logs, setLogs] = useState<string>('');
  const [isUpdateChecking, setIsUpdateChecking] = useState<boolean>(false);

  // 초기이벤트 
  useEffect(() => {

    // 업데이트 상태 응답
    const removeOnAppUpdateCheck = needElectron().common.onAppUpdateCheck((_event: any, eventId: string) => {
        
      let notifyMessage = '';
      
      switch (eventId) {
        case 'update-available':
            notifyMessage = '신규 버전이 존재합니다. 지금 설치 시 다운로드가 진행됩니다.';
            break;
        case 'update-not-diskusage':
            notifyMessage = '업데이트 공간 부족 ⚠️ 최소 1GB 이상의 여유 공간을 확보해주세요.';
            break;
        case 'update-not-available':
            notifyMessage = '현재 버전이 최신 버전입니다.';
            break;
        case 'error':
            notifyMessage = '업데이트 확인 중 오류가 발생했습니다.';
            break;
        default:
            notifyMessage = '업데이트 상태를 확인 중입니다...';
      }

      setLogs(JSON.stringify(notifyMessage, null, 2));
      setIsUpdateChecking(false);

    });

    // 업데이트 진행상태 응답
    // const removeOnAppUpdateProgress = needElectron().common.onAppUpdateProgress((_event:any, progressObj:any) => {
    
    //   const bytesPerSecond = progressObj.bytesPerSecond;
    //   const transferred    = progressObj.transferred;
    //   const total          = progressObj.total;

    //   const infoMessage = `속도 ${bytesToHumanRead(bytesPerSecond)}/s ( ${bytesToHumanRead(transferred)} / ${bytesToHumanRead(total)})`;

    //   console.log('????????????????? >> ', infoMessage);
    //   setLogs(infoMessage);

    // }); 

    return () => {
      removeOnAppUpdateCheck();
    //  removeOnAppUpdateProgress();
    };

  }, []);


    /** 
    * 환경변수 정보조회
    */
  const getEnv = async () => {
    setLogs(JSON.stringify(import.meta.env, null, 2));
  };

    /** 
    * IpcReport 정보조회
    */
  const getlistenrsInfo = async () => {
    
    const resultRender:any = await needElectron().common.getIpcRendererReport();

    const resultMain:any = await needElectron().common.getIpcMainReport();
    
    const result = `-------------- ipc 렌더러  \n 
                 ${JSON.stringify(resultRender, null, 2)} \n 
                -------------- ipc 메인  \n 
                 ${JSON.stringify(resultMain, null, 2)}`;

    setLogs(result);

  };


  /**
    * 연결 가능한 시리얼 포트 목록을 조회
    */
  const getSerialPort = async () => {
    
    const result:ComResponseType = await needElectron().printer.getSerialPorts();

    if (result.isSuccess) {
      setLogs(JSON.stringify(result.resultMessage, null, 2));
    } else {
      setLogs(`에러: ${result.errorMessage}`);
    }
  };

 
  /**
   * 창 최대화/최소화/창닫기 액션 처리
   */
  const handleWindowControl = (contorlId: 'maximize' | 'minimize' | 'close') => {
    needElectron().common.sendAppControlAction(contorlId);
  };

  /**
   *현재 사용 가능한 Port인지 확인
   */
  const handleCheckOpenPort = async (checkPort: string | number) => {

    const result:ComResponseType = await needElectron().common.getIsOpenPortCheck({
      checkPort: checkPort,
    });
  
    setLogs(JSON.stringify(result, null, 2));
  };

  /**
   * 연결 가능한 시리얼 포트 목록을 조회
   */
  const getSysetmInfo = async () => {
  
    try {
      const result:SystemInfo = await needElectron().common.getSystemInfo();

      if (result) {
        setLogs(JSON.stringify(result, null, 2));
      } else {
        setLogs('정보를 가져왔으나 데이터가 비어있습니다.');
      }
    } catch (error: any) {
      console.error('System Info Error:', error);
      setLogs(`확인불가: ${error.message || '통신 오류'}`);
    }
  };

  /**
   * App 업데이트 정보 조회
   */
  const getUpdateInfoAndProvider = async () => {

    try {
      const result = await needElectron().common.getUpdateInfoAndProvider();

      console.log('렌더러 result : >> ', result);
      setLogs(JSON.stringify(result, null, 2));

    } catch (error: any) {
      setLogs(`업데이트 확인 실패: ${error.message || '통신 오류'}`);
    }
  };

  /**
   * App 업데이트 체크
   */
  const sendAppUpdateCheck = async () => {

    if(isUpdateChecking) return; // 중복실행 방지

      setIsUpdateChecking(true);
      setLogs('업데이트 확인을 시작합니다...');

    try {
      const result:ComResponseType = await needElectron().common.getAppUpdateCheck();

      setLogs(JSON.stringify(result, null, 2));

      if(!result.isSuccess){
         setIsUpdateChecking(false);
      }

      console.log('업데이트 확인 : >>>>>> ', result);
    } catch (error: any) {
       setLogs(`업데이트 확인 실패: ${error.message || '통신 오류'}`);
       setIsUpdateChecking(false);
    }
  };

  /**
   * 고객화면: SHOW
   */
  const sendDidControlAction = (contorlId: 'show' | 'hide') => {

    console.log(contorlId);
    try {
        needElectron().did.sendDidControlAction(contorlId);
    } catch (error: any) {
       setLogs(`DID 컨트롤 실패: ${error.message || '통신 오류'}`);
    }
  };


  /**
   * Uint8Array to 이미지 체크
   */
  const printCheckImage = async () => {
    // const uint8ArrayData: any = await ReceiptGenerate.allImage(printData, printConfig);

    // const blob = new Blob([uint8ArrayData.buffer as ArrayBuffer], { type: 'image/png' });

    // const imageUrl = URL.createObjectURL(blob);

    // const imgTag = document.getElementById('test-receipt-img') as HTMLImageElement;
    // if (imgTag) {
    //     imgTag.src = imageUrl;
    // }

    //  window.open(imageUrl, '_blank');
  };


  /**
    * 알림
    */
  const sendNotificationData = async () => {
    
    const payload:any = {
      type:  'NEW_ORDER',
      title: '🔔 신규 주문 접수 알림', 
      body: '[1001번] 신규 주문이 들어왔습니다.',
    };

    needElectron().alarm.sendNotification(payload);
  };
  

  /**
   * 위젯화면 
   */
  const sendWidgetControlAction = (contorlId: 'show' | 'hide') => {

    console.log(contorlId);
    try {
        needElectron().widget.sendWidgetControlAction(contorlId);
    } catch (error: any) {
       setLogs(`위젯 컨트롤 실패: ${error.message || '통신 오류'}`);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2>메인 통신 테스트</h2>
      
      {/* 버튼 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
        <button onClick={() => setLogs('')}>로그 초기화</button>

        <button onClick={ getEnv }>환경변수</button>
        <button onClick={ getlistenrsInfo }>IpcReport</button>

        <button onClick={ getSerialPort }>시리얼포트 조회</button>

        <button onClick={ printCheckImage }>프린터-이미지검증</button>

        <button onClick={() => handleWindowControl('minimize')}>화면최소화</button>
        <button onClick={() => handleWindowControl('maximize')}>화면최대화</button>
        <button onClick={() => handleWindowControl('close')}>종료</button>
        <button onClick={() => handleCheckOpenPort('6554')}>포트체크</button>

        <button onClick={ getSysetmInfo }>시스템정보</button>
        <button onClick={ getUpdateInfoAndProvider }>업데이트정보 조회</button>
        <button onClick={ sendAppUpdateCheck }>수동업데이트</button>

        <button onClick={ () => sendDidControlAction('show') }>고객화면:SHOW</button>
        <button onClick={ () => sendDidControlAction('hide') }>고객화면:HIDE</button>

        <button onClick={ () => sendNotificationData() }>시스템 알림</button>

        <button onClick={ () => sendWidgetControlAction('show') }>위젯 설정:SHOW</button>
        <button onClick={ () => sendWidgetControlAction('hide') }>위젯 설정:HIDE</button>

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

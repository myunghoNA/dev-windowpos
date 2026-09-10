import { needElectron } from '@renderer/apis/need-electron.api';
import React, { useEffect, useRef } from 'react';


export function DemoWebView() {


  const adminUrl   = 'https://dev-admin.purpleplatform.co.kr';
  //const authUrl    = '/remoteLogin';
  //const apiToken   = 'eyJhbGciOiJIUzUxMiJ9.eyJtZW1iZXJJZCI6IkEwMTU1MDAwMDAwOCIsImlhdCI6MTcwNTI4NDE1OCwiZXhwIjo0ODU4ODg0MTU4fQ.pSI6WswMX25rwOVxLqiVqeOzn2-A4khO6MTnQEtbUQFMmvIS7Nxvh0p062vzf-1-lA-pi01Ymdzd6ugqR_j6Mg';
  //const returnUrl  = '/sales/salesCalendarPop';
  //const webviewSrc = `${adminUrl}${authUrl}?apiToken=${apiToken}&returnUrl=${returnUrl}`;
  const webviewSrc = `${adminUrl}`;

  const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        // 1. 외부 사이트 로드 요청
        needElectron().webview.sendLoadView(webviewSrc);

        // 2. 컨테이너의 실제 화면 좌표/크기를 계산해서 Main에 전달
        //    (WebContentsView는 React 레이아웃을 모르기 때문에 직접 알려줘야 함)
        const updateBounds = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            needElectron().webview.sendSetBounds({
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            });
        };

        updateBounds();
        window.addEventListener('resize', updateBounds);

        // 3. 언마운트 시 - 다른 화면으로 이동할 때 외부 사이트 영역을 숨김
        return () => {
            window.removeEventListener('resize', updateBounds);
            needElectron().webview.sendHideView();
        };
    }, [webviewSrc]);

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
           <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 100px)' }} />
        </div>
    );
}

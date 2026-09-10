// pages/MiniWidgetPage.tsx
import React from 'react';

export default function MiniWidget() {
  // Redux에서 미처리 주문 수 가져오기 (예시)
  const pendingCount = 5;

  const handleClick = () => {
    // 메인 프로세스에 창 복구 요청 (IPC 채널은 정의하신 것에 따라 맞춤)
    //needElectron().common.restoreMainWindow(); 
  };

  return (
    <>

    {/* 전역 스타일 강제 주입: html, body의 여백과 스크롤을 제거 */}
      <style>{`
        html, body, #root, #app {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
          background: transparent !important;
        }
        /* 윈도우 스크롤바 자체를 완전히 숨김 */
        ::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>


    <div style={styles.container} onClick={handleClick}>
        <div style={styles.badgeSection}>
            <span style={styles.countText}>{pendingCount}</span>
        </div>
        <div style={styles.infoSection}>
            <div style={styles.title}>미처리 주문</div>
            <div style={styles.statusText}>
                {pendingCount > 0 ? '확인이 필요합니다' : '대기 중'}
            </div>
        </div>
    </div>
  </>
  );
}

// 별도 설치 없이 사용하는 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 15px',
        cursor: 'pointer',
        overflow: 'hidden',      // 내용이 넘쳐도 스크롤 생성 안 함
        margin: 0,               // 기본 여백 제거
        boxSizing: 'border-box', // 테두리/패딩 때문에 크기 커지는 것 방지
        WebkitAppRegion: 'drag', // 드래그 가능하게 설정
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    } as any,
    badgeSection: {
        backgroundColor: '#ff4d4f',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '12px',
    },
    countText: {
        fontSize: '22px',
        fontWeight: 'bold',
    },
    infoSection: {
        display: 'flex',
        flexDirection: 'column',
        WebkitAppRegion: 'no-drag', // 텍스트 영역은 드래그 제외 가능
    } as any,
    title: {
        fontSize: '11px',
        color: '#aaa',
    },
    statusText: {
        fontSize: '13px',
        fontWeight: 500,
        marginTop: '2px',
    },
};

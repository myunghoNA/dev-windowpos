import React, { useState } from 'react';
// Import Hooks
import { usePagePerformance } from '@renderer/common/hooks';


export function DemoPrinterPreView() {
  
  const LOG_TITLE  = 'DemoPrinterPreView';
  // 성능측정
  usePagePerformance(LOG_TITLE);

  // 1. 주문번호, 메뉴명, 옵션명 크기 제어 (1: 보통, 2: 크게, 3: 더크게)
  const [settings, setSettings] = useState({
    orderNoSize: 1,
    menuNameSize: 1,
    optionNameSize: 1,
  });

  // 테스트용 가상 데이터
  const mockData = {
    orderNo: '001',
    totalCount: 5,
    items: [
      { name: '커플세트', count: 1 },
      { name: '아메리카노', count: 2, options: ['ICE', '샷 추가'] },
      { name: '레몬 에이드', count: 1 },
    ],
  };

  // 공통 선택 버튼 컴포넌트
  const SizeSelector = ({ label, currentSize, field }: any) => (
    <div style={{ marginBottom: '25px' }}>
      <h4 style={{ marginBottom: '10px', color: '#333' }}>{label}</h4>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[1, 2, 3].map((size) => (
          <button
            key={size}
            onClick={() => setSettings({ ...settings, [field]: size })}
            style={{
              flex: 1,
              padding: '10px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: currentSize === size ? '#007aff' : '#fff',
              color: currentSize === size ? '#fff' : '#333',
              fontWeight: currentSize === size ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            {size === 1 ? '보통' : size === 2 ? '크게' : '더크게'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px' }}>
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>주문서 글자 크기 설정</h2>
      
      <div style={{ display: 'flex', gap: '60px', alignItems: 'flex-start' }}>
        
        {/* --- 왼쪽: 설정 영역 --- */}
        <section style={{ width: '200px' }}>
          <SizeSelector label="주문번호 크기" currentSize={settings.orderNoSize} field="orderNoSize" />
          <SizeSelector label="메뉴명 크기"   currentSize={settings.menuNameSize} field="menuNameSize" />
          <SizeSelector label="옵션명 크기"   currentSize={settings.optionNameSize} field="optionNameSize" />
          
          <button style={saveButtonStyle}>설정 저장 및 테스트 인쇄</button>
        </section>

        {/* --- 오른쪽: 실시간 미리보기 --- */}
        <section>
          <div className="receipt-container" style={receiptPaperStyle}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>[주문서]</div>
            <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }} />
            
            {/* 주문번호 섹션 */}
            <div style={{ 
              fontSize: `${14 * settings.orderNoSize}px`, 
              fontWeight: settings.orderNoSize > 1 ? 'bold' : 'normal',
              lineHeight: '1.2',
            }}>
              주문번호: {mockData.orderNo}<br/>
              총주문: {mockData.totalCount}
            </div>
            
            <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
              <span>메뉴명</span><span>수량</span>
            </div>
            <div style={{ borderBottom: '1px solid #eee', margin: '8px 0' }} />
            
            {/* 메뉴 리스트 섹션 */}
            {mockData.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: `${14 * settings.menuNameSize}px`,
                  fontWeight: settings.menuNameSize > 1 ? 'bold' : 'normal',
                }}>
                  <span>{item.name}</span>
                  <span>{item.count}</span>
                </div>
                
                {/* 옵션 섹션 */}
                {item.options?.map(opt => (
                  <div key={opt} style={{ 
                    fontSize: `${12 * settings.optionNameSize}px`, 
                    color: '#555',
                    marginTop: '2px',
                    paddingLeft: '5px',
                  }}>
                    └ {opt}
                  </div>
                ))}
              </div>
            ))}
            
            <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }} />
            <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'right' }}>
               2026-03-26 13:10:00
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
            프린터 기종에 따라 실제 출력물과 차이가 있을 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}

// 스타일 모음
const receiptPaperStyle: React.CSSProperties = {
  width: '300px',
  minHeight: '400px',
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '25px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  fontFamily: 'monospace',
  lineHeight: '1.4',
};

const saveButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  backgroundColor: '#333',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '20px',
};
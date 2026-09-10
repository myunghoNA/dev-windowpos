import React, { useCallback, useMemo, useState } from 'react';
// Import Hooks



  interface Order { id: string; paymentMethod: 'CASH' | 'MADA'; totalPrice: number; }

  let count = 0;

  const PaymentButton = React.memo(({ onPay }: { onPay: () => void }) => {
    console.log('🚨 [경고] 결제 버튼 컴포넌트가 새로 그려졌습니다!');
    return <button onClick={onPay} style={{ padding: '20px' }}>💵 결제하기</button>;
  });


export function DemoPerfomance() {

  const [logs, setLogs] = useState<string>('');

  const [totalPrice, setTotalPrice] = useState(100);
  const [cashierName, setCashierName] = useState('Ahmed'); // 직원 이름

   /**#################### useCallback  #################### */
  // 의존성 배열인 [totalPrice]가 변하지 않는 한 
  // handlePayment 리렌더링 x
  // 자식 컴포넌트가 불필요하게 새로 그려지는 것을 막기 위함
  // 테이블 현황판이나 영수증 내역 같은 '대량의 반복 리스트' 필요할듯
  const handlePayment = useCallback(() => {
    console.log(`${totalPrice} 리얄 결제 완료!`);
  }, [totalPrice]);


  const handleChangeName = () => {
    setCashierName('Mohammed'+count);
    count++;
  };

  const handleChangeAmount = () => {
    setTotalPrice(totalPrice+count);
    count++;
  };

  /**#################### useMemo  #################### */
  // useMemo (동기적 연산): 
  //    >> 기존 데이터(orders)를 가지고 단순히 수학 계산, 필터링, 정렬을 해서 새로운 값을 뽑아내고 싶을 때 
  // useEffect (부수 효과): 
  //    >> 내 컴포넌트 내부 계산이 아니라 외부 세계(서버 API 호출,하드웨어 프린터 출력 등)에 명령을 내릴 때

  const [orders, setOrders] = useState<Order[]>([]); 

  // orders 배열이 변경될 때만 내부 루프 연산이 실행
  // 점주님이 검색창(filterText)에 타이핑을 할 때는 이 무거운 계산을 건너뛰고 기존 값을 0초 만에 반환
  const madaSalesCalculated = useMemo(() => {
    
    console.log(' [고비용 연산 발생] mada 카드 결제액 및 부가세를 새로 계산하는 중...');
    
    const madaOrders  = orders.filter(order => order.paymentMethod === 'MADA');
    const totalAmount = madaOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalVat    = totalAmount * 0.15; // 사우디 부가세 15%

    return { totalAmount, totalVat };
  }, [orders]); // 'orders'가 바뀔 때만 캐싱 만료!


  const handleAddOrders = () => {
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        paymentMethod: 'MADA',
        totalPrice: 15,
      };

      setOrders([...orders, newOrder]);
  };


  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2>최적화 테스트</h2>

      {/* 버튼 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
        <button onClick={() => setLogs('')}>로그 초기화</button>

        {/*##### useCallback 적용 */}
        <button onClick={() => handleChangeName()}>근무자변경</button>
        <p>근무자: {cashierName} / {totalPrice}</p>
        <button onClick={() => handleChangeAmount()}>금액변경</button>
        <PaymentButton onPay={handlePayment} />

         {/*##### useMemo 적용 */}
         <button onClick={() => handleAddOrders()}>orders추가</button>
         <div style={{ marginTop: '15px' }}>
           <p>💳 Mada 총 결제 금액: <strong>{madaSalesCalculated.totalAmount} SAR</strong></p>
           <p>🧾 납부할 총 부가세(VAT 15%): <strong>{madaSalesCalculated.totalVat} SAR</strong></p>
      </div>

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

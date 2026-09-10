import React, { useEffect, useRef, useState } from 'react';
// Import Hooks
import { usePagePerformance } from '@renderer/common/hooks';
import { useCounter } from '@renderer/common/hooks/demo-count.hooks';
// Import Helper



const orders = [
  { id: 1, item: '아메리카노', method: 'CARD', price: 4500 },
  { id: 1, item: '아메리카노', method: 'CARD', price: 9500 },
  { id: 2, item: '카페라떼', method: 'CASH', price: 5000 },
  { id: 3, item: '유자차', method: 'CARD', price: 5500 },
  { id: 4, item: '쿠키', method: 'CASH', price: 2000 },
];

const cart = [
  {
    id: 1,
    name: '오징어 볶음',
    price: 15000,
    quantity: 2,
    options: [
      { name: '맵기', value: '아주 맵게', extraPrice: 0 },
      { name: '사리추가', value: '라면사리', extraPrice: 2000 },
    ],
  },
  {
    id: 2,
    name: '콜라',
    price: 2000,
    quantity: 3,
    options: [], // 옵션 없음
  },
];



export function DemoDataProcess() {

  const LOG_TITLE  = 'DemoDataProcess';
  // 성능측정
  usePagePerformance(LOG_TITLE);

  const [logs, setLogs] = useState<string>('');

  // 총합
  const getTotalSum = async () => {
  
    // 카드결제 총합
    const cardTotal = orders
    .filter(order => order.method === 'CARD')
    .reduce((acc, cur) => acc + cur.price, 0);

    const stats = orders.reduce((acc, cur) => {
      // 해당 결제 수단이 없으면 0으로 초기화 후 더하기
      acc[cur.method] = (acc[cur.method] || 0) + cur.price;
      return acc;
    }, {});

    let result =  `orders : ${ JSON.stringify(orders, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `stats : ${ JSON.stringify(stats, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `카드 합계: : ${ cardTotal } \n `;

      // 상품 + 옵션 가격  총합
      const totalCartPrice = cart.reduce((total, item) => {
        // 1. 옵션들의 추가 금액 합계 구하기
        const optionTotal = item.options.reduce((optSum, opt) => optSum + opt.extraPrice, 0);
        // 2. (기본가 + 옵션가) * 수량
        return total + (item.price + optionTotal) * item.quantity;
      }, 0);

        result = result + '################################ \n';
        result = result + `cart : ${ JSON.stringify(cart, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `cart 총금액: :  ${ JSON.stringify(totalCartPrice, null, 2) } \n `;

    setLogs(result);
  };

  // 데이터 찾기
  const getSchData = async () => {
  
    const targetItem = orders.find(order => order.id === 3);

    // some & every: 조건 확인 (유효성 검사)
    const hasCash = orders.some(order => order.method === 'CASH');
    const isAllExpensive = orders.every(order => order.price >= 1000);
 
    let result =  `orders : ${ JSON.stringify(orders, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `ID3인 항목 : ${ JSON.stringify(targetItem, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `현금 결제 존재여부: ${ JSON.stringify(hasCash, null, 2) } \n `;
        result = result + `모든 상품이 1000원 이상여부: ${ JSON.stringify(isAllExpensive, null, 2) } \n `;

    setLogs(result);
  };

  // 신규컬럼추가
  const actionAddColumn = async () => {
  
    // 컬럼 가공 추가
    const displayList = orders.map(order => {
      return {
        ...order,
        displayTitle: `${order.item} (행사중)`,
        halfPrice: order.price / 2, 
      };
    });

    // 데이터 그룹화
    const priceMap = Object.fromEntries(orders.map(order => [order.id, order.item]));
    // 중복제거
    const uniqueItems = [...new Set(orders.map(order => order.item))];

    // 결제수단별
    const groupedByMethod = orders.reduce((acc, cur) => {
      const method = cur.method;
      if (!acc[method]) acc[method] = []; // 해당 결제수단 칸이 없으면 만들기
      acc[method].push(cur);
      return acc;
    }, {});
 
    let result =  `orders : ${ JSON.stringify(orders, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `displayList : ${ JSON.stringify(displayList, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `priceMap : ${ JSON.stringify(priceMap, null, 2) } \n `;
        result = result + `priceMap[1] : ${ JSON.stringify(priceMap['1'], null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `상품중복제거: ${ JSON.stringify(uniqueItems, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `결제수단별: ${ JSON.stringify(groupedByMethod, null, 2) } \n `;
        result = result + `카드 주문 건수:: ${ JSON.stringify(groupedByMethod['CARD'].length, null, 2) } \n `;

    setLogs(result);
  };

  // 정렬
  const actionSort = async () => {

    // [오름차순] 가격 낮은 순서대로
    const lowToHigh = [...orders].sort((a, b) => a.price - b.price);

    // [내림차순] 가격 높은 순서대로
    const highToLow = [...orders].sort((a, b) => b.price - a.price);

    // [가나다순] 메뉴 이름 이름순 정렬
    const alphaOrder = [...orders].sort((a, b) => a.item.localeCompare(b.item));

    let result =  `[오름차순] 가격 낮은 순서대로 : ${ JSON.stringify(lowToHigh, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `[내림차순] 가격 높은 순서대로 : ${ JSON.stringify(highToLow, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `[가나다순] 메뉴 이름 이름순 정렬 : ${ JSON.stringify(alphaOrder, null, 2) } \n `;

        setLogs(result);
  };

  // 특정위치처리
  const actionSlice = async () => {

    // 최근 들어온 주문 2개만 자르기 (뒤에서부터 2개)
    const recentOrders = orders.slice(-2);

    // 특정 인덱스의 아이템을 새로운 아이템으로 교체하기
    // (예: 1번 인덱스의 카페라떼를 '바닐라라떼'로 교체)
    const updatedOrders = [...orders];
    updatedOrders.splice(1, 1, { id: 2, item: '바닐라라떼', method: 'CASH', price: 5500 });

    // 아이템 이름이 '쿠키'인 데이터 삭제
    const targetIndex = orders.findIndex(order => order.item === '쿠키');
   
    if (targetIndex !== -1) {
      // targetIndex 번호부터 딱 1개만 삭제해라!
      orders.splice(targetIndex, 1);
    }


    let result =  `뒤에서부터 2개 자르기 : ${ JSON.stringify(recentOrders, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `1번 인덱스의 카페라떼를 '바닐라라떼'로 교체 : ${ JSON.stringify(updatedOrders, null, 2) } \n `;
        result = result + '------------------------------- \n';
        result = result + `아이템 이름이 '쿠키'인 데이터 삭제 : ${ JSON.stringify(orders, null, 2) } \n `;

        setLogs(result);
  };

  // 공통코드
  const getComcode = async () => {

    //const options = Object.entries(OrderTypeLabel).map(([value, label]) => ({ value, label }));

    // let result =  `getComcode : ${ JSON.stringify(options, null, 2) } \n `;
    //     result = result + '------------------------------- \n';
    //     result = result + `OrderSectionLabel.PICKUP : ${ JSON.stringify(OrderTypeLabel.get(OrderType.PICKUP), null, 2) } \n `;

    //     setLogs(result);
  };


  // 통합 핸들러 예시
  const [shopName, setShopName] = useState<string>('사우디 1호점');
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
  const [selectedPort, setSelectedPort] = useState<string>('COM3');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;        // string
    const checked = e.target.checked;    // boolean

    // 요소의 type 속성에 따라 다르게 처리
    if (e.target.type === 'checkbox') {
      setAutoPrint(checked);
      setLogs(`영수증 자동 출력 변경: ${checked}`);
    } 
    else {
      setShopName(value);
      setLogs(`매장 이름 입력 중: ${value}`);
    }
  };

  // select 요소 전용 핸들러
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value; 
    setSelectedPort(value);
    setLogs(`연결할 시리얼 포트 변경: ${value}`);
  };

  // useRef 예시 (실제 태그 조종)
  const idInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 화면이 다 그려지면(Mount), 인풋창에 커서를 강제로 이동
    if (idInputRef.current) {
      idInputRef.current.focus();
    }
  }, []);

  //## 커스텀 hook - count 
  const { count, increment, reset, decrement } = useCounter(0);


  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2>데이터처리</h2>
      
      {/* 버튼 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
        <button onClick={ getTotalSum }>총합구하기</button>
        <button onClick={ getSchData }>데이터찾기/검사</button>
        <button onClick={ actionAddColumn }>데이터 추가/그룹</button>
        <button onClick={ actionSort }>정렬</button>
        <button onClick={ actionSlice }>특정위치처리</button>
        <button onClick={ getComcode }>공토코드조회</button>
      </div>

      {/* 일반 텍스트 Inuput 이벤트 예시 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>매장 이름 (Text):</label>
        <input 
          type="text" 
          value={shopName} 
          onChange={handleChange} 
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      {/* 체크박스 Inuput 이벤트 예시 */}
      <div style={{ marginBottom: '15px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={autoPrint} 
            onChange={handleChange} 
          />
          결제 완료 시 영수증 자동 출력 (Checkbox)
        </label>
      </div>

      {/* Select 드롭다운 이벤트 예시 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>프린터 연결 포트 (Select):</label>
        <select value={selectedPort} onChange={handleSelect} style={{ width: '100%', padding: '8px' }}>
          <option value="COM1">COM1 (주방 프린터)</option>
          <option value="COM2">COM2 (바코드 스캐너)</option>
          <option value="COM3">COM3 (영수증 프린터)</option>
          <option value="COM4">COM4 (카드 단말기)</option>
        </select>
      </div>

      <div style={{ padding: '20px' }}>
        <h2>로그인</h2>
        <input ref={idInputRef} type="text" placeholder="번호 입력" />
        <button>로그인</button>
      </div>

      {/* 수량 제어 영역 */}
      <div>
        <button onClick={decrement} disabled={count <= 1}>-</button>
        <span style={{ margin: '0 10px', fontSize: '18px' }}>{count} 개</span>
        <button onClick={increment}>+</button>

        <button onClick={reset}>reset</button>
      </div>

      {/* 결과 표시 영역 **/}
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

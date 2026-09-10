import React, { useEffect, useState } from 'react';
// Import Hooks
import { usePagePerformance } from '@renderer/common/hooks';
// Import Stor
// Import Helper
import {
  bytesToHumanRead,
  calculateVat,
  decrypt,
  delay,
  encrypt,
  formatCurrency,
  formatDateString,
  formatPhoneNumber,
  formatTimeString,
  formatUtcTimestamp,
  getDiffDays,
  getObjectValue,
  getToday,
  getVatAmount,
  groupByArray,
  isEmpty,
  isNotNull,
  isNumeric,
  maskPhoneNumber,
  maskString,
  nextTick,
  pickToObject,
  reverseValue,
  sortByArray,
  stringToNumber,
  substringFromByte,
  SweetAlert,
  toArabicDigits,
  toSafeNumber,
} from '@renderer/common/helpers';



interface UserProfile {
  name: string;
  role: string;
  isActive: boolean;
}

export function DemoFunctionCall() {

  const LOG_TITLE  = 'DemoFunctionCall';
  // 성능측정
  usePagePerformance(LOG_TITLE);

  const [logs, setLogs] = useState<string>('');

  const [countST, setCount] = useState<any>({
    seq:0,
    text: '',
  });
  
  useEffect(() => {
     
     const str = identity('hello');  // str: string
     const num = identity(42);       // num: number

     console.log('효과 발생 >>>>>>>>>>>>>', countST, str, num);

    return () => {
      console.log('효과 해제 >>>>>>>>>>>>', countST);
    };
  }, [countST.seq]); 

  function identity<T>(value: T): T {
    return value;
  }

  /**
   * 입력된 문자열을 AES 방식으로 암호화
  */
  const getEncrypt = async () => {
  
    const params = 'myungho00';
    const encryptResult = encrypt(params);
    const decryptResult = decrypt(encryptResult);

    const result = `암호화 : ${encryptResult} \n 복호화 : ${decryptResult} `;


    setLogs(result);

    setCount({...countST, seq: countST.seq + 1});

  };


  /**
   * 입력된 문자열을 역순 반환
  */
  const getReverse = async () => {
  
    const params = 'myungho00';
    const reverseResult = reverseValue(params);

    const result = `원본 : ${params} \n리버스결과 : ${reverseResult} `;

    setLogs(result);

    setCount({...countST, text: countST.text + params});
   
  };

  /**
   * 입력된 문자열 마스킹
  */
  const getMaskString = async () => {
  
    const params = 'myungho00';
    const maskStartResult  = maskString(params, 4, 'start');
    const maskMiddleResult = maskString(params, 2, 'middle');
    const maskEndResult    = maskString(params, 4, 'end');

    const result = `원본 : ${params} \n결과 시작: ${maskStartResult}\n결과 중간: ${maskMiddleResult}\n결과 끝: ${maskEndResult} `;

    setLogs(result);
   
  };

  /**
   * 문자열 바이트 단위자르기
  */
  const getSubStringByte = async () => {
  
    const params = '한글ABC';
    const eaxamResult1  = substringFromByte(params, 1, 4);
    const eaxamResult2  = substringFromByte(params, 5, 3);

    const result = `원본 : ${params} \n1에서 4byte: ${eaxamResult1}\n5에서 3byte: ${eaxamResult2} `;

    setLogs(result);
   
  };

  /**
   * 파일사이즈 변환
  */
  const getFormatBytes = async () => {
  
    const params = 1024;
    const eaxamResult1  = bytesToHumanRead(1024);
    const eaxamResult2  = bytesToHumanRead(1234567, 2);

    const result = `원본 : ${params} \n1024: ${eaxamResult1}\n1234567: ${eaxamResult2} `;

    setLogs(result);
   
  };

  /**
   * 전화번호 포맷 변환
  */
  const getFormatPhoneNumber = async () => {
  
    const params = '01012345678';
    const eaxamResult1  = (params);
    const eaxamResult2  = formatPhoneNumber('0101234567', '/');
    const eaxamResult3  = formatPhoneNumber('0101234567901', '/');

    const result = ` 01012345678: ${eaxamResult1}\n 0101234567: ${eaxamResult2}\n 0101234567901: ${eaxamResult3} `;
    
    setLogs(result);
   
  };

  /**
   * 전화번호 마스킹 변환
  */
  const getMaskPhoneNumber = async () => {
  
    const params = '01012345678';
    const eaxamResult1  = maskPhoneNumber(params);
    const eaxamResult2  = maskPhoneNumber('0101234');
    const eaxamResult3  = maskPhoneNumber('0101234567');

    const result = ` 01012345678: ${eaxamResult1}\n 0101234: ${eaxamResult2}\n 0101234567: ${eaxamResult3} `;
    
    setLogs(result);
   
  };

  /**
   * 숫자변환 
  */
  const getNumber = async () => {
  
    const params = '50';
    const eaxamResult2  = toSafeNumber(params);
    const eaxamResult3  = stringToNumber(30);
    const eaxamResult4  = toArabicDigits(params);

    const result = `원본 : ${params} \n 
                    toSafeNumber: ${eaxamResult2} \n 
                    toSafeNumber: ${eaxamResult3} \n 
                    toArabicDigits: ${eaxamResult4}`;
    
    setLogs(result);
   
  };

  /**
   * Validate 
  */
  const isValidater = async () => {
  
    const params = '50';
    const eaxamResult1  = isNotNull(null);
    const eaxamResult2  = isNotNull('');
    const eaxamResult3  = isNotNull([]);

    const eaxamResult4  = isEmpty(null);
    const eaxamResult5  = isEmpty('');
    const eaxamResult6  = isEmpty([]);


    const eaxamResult7  = isNumeric('123');
    const eaxamResult8  = isNumeric('');
    const eaxamResult9  = isNumeric('한글');

    
    const result = `원본 : ${params} \n 
                 isNotNull(null): ${eaxamResult1} \n 
                 isNotNull(''): ${eaxamResult2} \n 
                 isNotNull([]): ${eaxamResult3} \n

                 isEmpty(null): ${eaxamResult4} \n
                 isEmpty(''): ${eaxamResult5} \n
                 isEmpty([]): ${eaxamResult6} \n

                 isNumeric('123'): ${eaxamResult7} \n
                 isNumeric(''): ${eaxamResult8} \n
                 isNumeric('한글'): ${eaxamResult9} \n
                 `;
    
    setLogs(result);
   
  };

  /**
   * getDateTime 
  */
  const getDateTime = async () => {

        const result = `
          format(new Date()): ${formatDateString(new Date())} \n 
          format(new Date(), 'YYYY-MM-DD HH:mm:ss')): ${formatDateString(new Date(), 'YYYY-MM-DD HH:mm:ss')} \n 

          getToday('YYYY-MM-DD HH:mm:ss'): ${getToday('YYYY-MM-DD HH:mm:ss')} \n 
          getToday('HH:mm:ss'): ${getToday('HH:mm:ss')} \n 

          getDiffDays('2026-03-01', '2026-03-02'): ${getDiffDays('2026-03-01', '2026-03-02')} \n 

          formatDateTime('2026-03-01 15:30:22', 'YYYY-MM-DD'): ${formatTimeString('2026-03-01 15:30:22', 'YYYY-MM-DD')} \n 
          formatDateTime('2026-03-01 15:30:22', 'HH:mm:ss'): ${formatTimeString('2026-03-01 15:30:22', 'HH:mm:ss')} \n 

          toUTC('2026-03-01 15:30:22'): ${formatUtcTimestamp('2026-03-01 15:30:22')} \n 

          
          `;
    
    setLogs(result);

  };

  /**
   * getAsync 
  */
  const getAsync = async () => {

    let result = getToday('YYYY-MM-DD HH:mm:ss') + '2초 Delay 시작';
    setLogs(result);

    await delay(2000);

    result = result + '\n' + getToday('YYYY-MM-DD HH:mm:ss') + ' 실행완료'; 
    setLogs(result);

    nextTick().then(() => {
      result = result + '\n' + getToday('YYYY-MM-DD HH:mm:ss') + ' 나중에 처리될 백그라운드 작업'; 
      setLogs(result);
    });

    result = result + '\n' + getToday('YYYY-MM-DD HH:mm:ss') + ' 최종'; 
    setLogs(result);

  };

  /**
   * getObject 
  */
  const getObject = async () => {

      const storeData = {
          info: {
              name: '테스트 매장',
              settings: {
                  isAutoPrint: true,
              },
          },
          open: '12시',
          close: '24시',
          orders: [
              { id: 101, total: 50000 },
          ],
      };

      const orders = [
          { id: 1, item: '아메리카노', method: 'CARD', price: 4500 },
          { id: 2, item: '카페라떼', method: 'CASH', price: 5000 },
          { id: 3, item: '유자차', method: 'CARD', price: 5500 },
          { id: 4, item: '쿠키', method: 'CASH', price: 2000 },
      ];

      const result = `
          getValue(storeData, 'info.settings.isAutoPrint', false): ${getObjectValue(storeData, 'info.settings.isAutoPrint', false)} \n 
          getValue(storeData, 'orders.0.id', ''): ${getObjectValue(storeData, 'orders.0.id', '')} \n 
          getValue(storeData, 'info.manager.name', '없음'): ${getObjectValue(storeData, 'info.manager.name', '없음')} \n 

          pickObject(storeData, ['info', 'open']): ${JSON.stringify(pickToObject(storeData, ['info', 'open']), null, 2)} \n 

          groupBy(orders, 'method'): ${JSON.stringify(groupByArray(orders, 'method'), null, 2)} \n 
          sortBy(orders, 'price', 'desc'): ${JSON.stringify(sortByArray(orders, 'price', 'desc'), null, 2)} \n 
          `;
    
          setLogs(result);
  };

  /**
   * getStorage 
  */
  // const getStorage = async () => {

  //       StorageHelper.set(STORAGE_KEYS.LOGIN_ID, 'TEST_ID');
  //       StorageHelper.set(STORAGE_KEYS.AUTH_TOKEN, '1231233434234234');

  //       const result = `
  //         StorageHelper.get(STORAGE_KEYS.LOGIN_ID, ""): ${StorageHelper.get(STORAGE_KEYS.LOGIN_ID, '')} \n 
  //         `;
    
  //       setLogs(result);
  // };

  /**
   * getCalVat 
  */
  const getCalVat = async () => {

        const netPrice = 1000; // 공급가액
        const vat   = calculateVat(netPrice);   // 150
        const total = getVatAmount(netPrice); // 1150

        let result =  `공급가액 : ${formatCurrency(netPrice, 'ko-KR', true)} \n `;
            result = result + `부가세(15%): : ${ formatCurrency(vat, 'ko-KR', true) } \n `;
            result = result + `총 합계: : ${formatCurrency(total, 'ko-KR', true) } \n  `;
            result = result + '------------------------------- \n';

            result = result + `공급가액   : ${formatCurrency(netPrice, 'ar-SA', true)} \n `;
            result = result + `부가세(15%): ${ formatCurrency(vat, 'ar-SA', true) } \n `;
            result = result + `총 합계    : ${formatCurrency(total, 'ar-SA', true) } \n  `;
        setLogs(result);
  };

  /**
   * 알림메시지 
   */
  const getAlertControlAction = async (contorlId: 'info' | 'warn' | 'error' | 'confirm') => {

    switch (contorlId) {
        case 'info':
            SweetAlert.fire('출력 완료', '영수증이 정상적으로 출력되었습니다.');
            break;
        case 'warn':
            SweetAlert.warn('용지 확인', '용지가 얼마 남지 않았습니다.');
            break;
        case 'error':
            SweetAlert.error('프린터 오류', '케이블 연결 상태를 확인해주세요.');
            break;
        case 'confirm': {

          const isConfirmed = await SweetAlert.confirm('주문 취소', '정말 이 주문을 취소하시겠습니까?');

          if (isConfirmed) {
            console.log('주문이 취소되었습니다.');
          } else {
            console.log('취소가 중단되었습니다.');
          }
          break;
        }
    }

  };

  /**
   * Zustand 스토어 
   */
  // const cart       = useDemoOrderStore((state) => state.cart);
  // const totalPrice = useDemoOrderStore((state) => state.totalPrice);

  // const { addItem, removeItem, updateQuantity, clearCart } = useDemoOrderStore((state) => state.actions);

  // const actionZustand = async (contorlId: string) => {
  
  //   if(contorlId === 'addItem'){
  //     addItem({ id: 'squid_01', name: '영월 매콤 오징어', price: 15000 });
  //     addItem({ id: 'squid_02', name: '아이스아메리카노', price: 2000 });
  //   }
  //   else if(contorlId === 'plusItem'){
  //     updateQuantity('squid_01', 1);
  //   } 
  //   else if(contorlId === 'minusItem'){
  //     updateQuantity('squid_01', -1);
  //   } 
  //   else if(contorlId === 'removeItem'){
  //     removeItem('squid_01');
  //   } 
  // };

  // useEffect(() => {
    
  //   if (cart.length > 0) {
  //     let result =  `장바구니 업데이트됨 : ${ JSON.stringify(cart, null, 2) } \n `;
  //         result = result + `총 결제 금액: : ${ totalPrice } \n `;
  //     setLogs(result);
  //   }else{
  //     setLogs('');
  //   }

  // }, [cart, totalPrice]);

  // useEffect(() => {
  //   return () => {
  //     clearCart(); 
  //   };
  // }, []);


  // 에러발생
  const [isExplode, setIsExplode] = React.useState(false);
  const actionError = () => {
      setIsExplode(true);
  };

  if (isExplode) {
    const obj: any = undefined;
    return <div>{obj.renderError()}</div>; // 렌더링 도중 폭발!
  }

  const getEtc = async () => {

    if (!('getBattery' in navigator)) {
        return null; // 배터리 없는 데스크탑 PC(대부분의 매장 POS)일 가능성이 높음
    }

    const battery:any = await navigator.getBattery();

    console.log('battery >>>>  ', battery);

    const result =  `battery :::: : ${battery} \n `;
            // result = result + `부가세(15%): : ${ formatCurrency(vat, 'ko-KR', true) } \n `;
        setLogs(result);
  };

  /** ***********************
   * 문법  
   ************************/
  const getSampleProcess = () => {

    //########## 💡객체 상태 업데이트 (기존 값 보존하며 특정 프로퍼티만 변경)
    const profile:UserProfile = {
      name: 'Kim',
      role: 'Developer',
      isActive: false,
    };

    console.log('기존 값 보존하며 특정 프로퍼티만 변경',{
       ...profile,
       isActive: true,
    });

    //########## 💡배열 상태 업데이트 (불변성을 지키며 아이템 추가/삭제)
    const todolist:string[] = ['Task 1', 'Task 2'];

    console.log('배열 상태 업데이트 (불변성을 지키며 아이템 추가/삭제)',[
       ... todolist,
       'TASK 3', // push() 대신 새로운 배열 생성
    ]);

    //########## 💡 한 번의 루프로 총 금액(totalPrice)과 총 수량(totalQty)을 동시에 구하는 패턴
    const cart: any[] = [
      { menuName: '치킨 세트', price: 40, quantity: 2 },
      { menuName: '샤와르마', price: 15, quantity: 3 },
      { menuName: '콜라', price: 5, quantity: 1 },
    ];

    const { totalPrice, totalQty } = cart.reduce(
      (acc, cur) => {
        acc.totalPrice += cur.price * cur.quantity;
        acc.totalQty   += cur.quantity;
        return acc;
      },
      { totalPrice: 0, totalQty: 0 }, // 초기값 객체 세팅
    );

    console.log('한 번의 루프로 총 금액/총 수량을 동시에 구하는 패턴',`총 금액: ${totalPrice}, 총 수량: ${totalQty} `);


    //########## 💡 배열을 { 'm1': { id: 'm1', name: '아메리카노' } } 구조로 바꾸는 패턴
    const menuList: any[] = [
      { id: 'm1', name: '아메리카노' },
      { id: 'm2', name: '카페라떼' },
    ];

    const menuMap = menuList.reduce<Record<string, any>>((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {});

    console.log('배열을 { m1: { id: m1, name: 아메리카노 } } 구조로 바꾸는 패턴 ', menuMap, menuMap['m1']);

    
    //########## 💡 find: 조건에 맞는 첫 번째 '요소' 자체를 반환 (없으면 undefined)
    const methods: any[] = [
      { type: 'CASH', isPrimary: false },
      { type: 'CARD', isPrimary: true },
      { type: 'APPLE_PAY', isPrimary: false },
    ];

    const primaryMethod = methods.find(method => method.isPrimary);
    console.log('find: 조건에 맞는 첫 번째 요소 자체를 반환', primaryMethod?.type); // 'CARD'


    //########## 💡 findIndex: 조건에 맞는 요소의 '방 번호(Index)'를 반환 (없으면 -1)
    const targetIndex  = methods.findIndex(method => method.type === 'APPLE_PAY');
    const targetIndex2 = methods.findIndex(method => {
      return (
        method.type === 'APPLE_PAY' &&
        method.isPrimary === false
      );
    });

    console.log('findIndex: 조건에 맞는 요소의 번호(Index) 를 반환 (없으면 -1)', targetIndex, targetIndex2);


    //##########💡 some: "단 하나라도 조건을 만족하면 true
    const orderMenus: any[] = [
      { name: '치킨 세트', isSoldOut: false },
      { name: '샤와르마', isSoldOut: true }, 
      { name: '콜라',    isSoldOut: false },
    ];

    const hasSoldOutItem = orderMenus.some(menu => menu.isSoldOut === true);
    if (hasSoldOutItem) {
      console.log('경고: 장바구니에 품절된 상품이 포함되어 있음 !', hasSoldOutItem);
    }

    //########## 💡 every: "모든 요소가 전부 조건을 만족하는가?" (전부 주문 가능한 상태인가?)
    const isAllAvailable = orderMenus.every(menu => !menu.isSoldOut);
    console.log('every: "모든 요소가 전부 조건을 만족하는가', isAllAvailable); // false (샤와르마 때문에)

    //########## 💡 flatMap: 모든 주문에서 판매된 아이템들을 하나의 거대한 1차원 배열로 통합하는 패턴
    const dailyOrders: any[] = [
      { orderId: '001', items: ['치킨', '콜라'] },
      { orderId: '002', items: ['샤와르마'] },
      { orderId: '003', items: ['치킨', '사이다'] },
    ];

    const allSoldItems = dailyOrders.flatMap(order => order.items);
    console.log('flatMap: 1차원 배열로 통합하는 패턴', allSoldItems); // ['치킨', '콜라', '샤와르마', '치킨', '사이다']


    //########## 💡 Set을 활용한 초고속 중복 제거
    const soldItems = ['치킨', '콜라', '샤와르마', '치킨', '사이다'];
    const uniqueMenuNames = [...new Set(soldItems)];

    console.log('Set을 활용한 초고속 중복 제거', uniqueMenuNames); // ['치킨', '콜라', '샤와르마', '사이다']

    //##########  💡 reduce를 활용한 항목별 개수 카운팅 (Frequency Map)
    const itemCounts = soldItems.reduce<Record<string, number>>((acc, menu) => {
      acc[menu] = (acc[menu] || 0) + 1; // 기존 값 있으면 +1, 없으면 0에서 +1
      return acc;
    }, {});

    console.log('reduce를 활용한 항목별 개수 카운팅 (Frequency Map)', itemCounts);

  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2>FUNCTION CALL 테스트</h2>
      
      {/* 버튼 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
        <button onClick={() => setLogs('')}>로그 초기화</button>
        <button onClick={ getEncrypt }>Aes 암호화/복호화</button>
        <button onClick={ getReverse }>문자열 리버스</button>
        <button onClick={ getMaskString }>문자열 마스킹</button>
        <button onClick={ getSubStringByte }>문자열 바이트 단위자르기</button>
        <button onClick={ getFormatBytes }>파일사이즈 변환</button>
        <button onClick={ getFormatPhoneNumber }>전화번호 포맷 변환</button>
        <button onClick={ getMaskPhoneNumber }>전화번호 마스킹 변환</button>

        <button onClick={ getNumber }>숫자변환</button>
        <button onClick={ isValidater }>validater</button>
        <button onClick={ getDateTime }>날짜</button>

        <button onClick={ getCalVat }>VAT계산</button>


        <button onClick={ getAsync }>Async</button>
        <button onClick={ getObject }>오브젝트 값 조회</button>

        {/* <button onClick={ getStorage }>스토리지값 조회</button> */}
        <button onClick={ actionError }>ErrorBoundary</button>

        <button onClick={ () => getAlertControlAction('info') }>Alert:info</button>
        <button onClick={ () => getAlertControlAction('warn') }>Alert:warn</button>
        <button onClick={ () => getAlertControlAction('error') }>Alert:error</button>
        <button onClick={ () => getAlertControlAction('confirm') }>Alert:confirm</button>

        {/* <button onClick={ () => actionZustand('addItem') }>Zustand:추가</button>
        <button onClick={ () => actionZustand('plusItem') }>Zustand:수량 +1</button>
        <button onClick={ () => actionZustand('minusItem') }>Zustand:수량 -1</button>
        <button onClick={ () => actionZustand('removeItem') }>Zustand:항목삭제</button> */}

        <button onClick={ () => getSampleProcess() }>데이터처리</button>

        <button onClick={ () => getEtc() }>기타</button>
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

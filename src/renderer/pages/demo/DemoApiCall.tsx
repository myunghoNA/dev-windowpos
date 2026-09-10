import React, { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '@renderer/redux/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import Cookies from 'js-cookie';

import { OrderStatus } from '@renderer/providers';
// Import Hooks
import { useNetworkStatus } from '@renderer/common/hooks';
// Import Helper
import { customLogger, openOrderStatusCounts } from '@renderer/common/helpers';
import { InitOrderStatusCounts } from '@renderer/providers';
// Import Provider
import { getOrderByPk, getOrdersByStore } from '@renderer/common/repositories/order.repository';
import { getItemsByStore } from '@renderer/common/repositories/store-item.repository';
import {
  cancelOrderStatus,
  completeOrderStatus,
  confirmOrderStatus,
  deliveryOrderStatus,
  getOpenAllOrders,
  readyOrderStatus,
  refuseOrderStatus,
} from '@renderer/common/services/order.service';
import { availableItemStatus, getStoreItems, soldoutItemStatus } from '@renderer/common/services/store-item.service';
import { getTerminalInfo, updateTerminal } from '@renderer/common/services/terminal.service';
import {
  socket,
} from '@renderer/providers/socket.provider';
import { BaseOrderStatusRequest, ItemData, ItemGroup, OrderStatusCounts } from '@shared/types';


export function DemoApiCall() {

  const [logs, setLogs] = useState<string>('');
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.CONFIRM);
  const [orderId, setOrderId] = useState<number | ''>('');

  const isOnline = useNetworkStatus();
  const session = useAppSelector((state) => state.session.current);

  const openAllOrders = useLiveQuery(
          () => session?.storeId ? getOrdersByStore(session.storeId) : undefined,
          [session?.storeId],
      );

  const storeItems = useLiveQuery(
          () => session?.storeId ? getItemsByStore(session.storeId) : undefined,
          [session?.storeId],
      );

  const statusCounts = useMemo<OrderStatusCounts>(() => {
      if (!openAllOrders) return InitOrderStatusCounts;
      return openOrderStatusCounts(openAllOrders);
  }, [openAllOrders]);


  useEffect(() => {
     const params = {
      orders : openAllOrders,
      statusCounts: statusCounts,
     };

     setLogs(JSON.stringify(params, null, 2));

  }, [statusCounts]); 

  useEffect(() => {
     setLogs(JSON.stringify(storeItems, null, 2));
  }, [storeItems]); 


  /**
   * aixos를 이용한 api조회 샘플
  */
  const sendLokiLog = async () => {
    
    customLogger.info('PAYMENT_SUCCESS', {
        event_type: 'order_flow',
        order_id: 'ORD-20260401-102', 
        pay_method: 'card',
    }, {
        pay_type: 'payment_flow',
        pay_id: 'PAY-20260401-102', 
        pay_method: 'card',
    });
   
  };

  /**
   * 소켓 리스너 상태확인 테스트
  */
  const logActiveListeners = async () => {
      // socket.io-client 내부의 _callbacks 객체에 리스너 정보가 담겨 있습니다.
      const listeners = (socket as any)._callbacks;
      
      customLogger.info('==== [SOCKET] 현재 활성화된 리스너 목록 ====');

      let result =  '==== [SOCKET] 현재 활성화된 리스너 목록 ==== \n ';
           
      
      if (!listeners || Object.keys(listeners).length === 0) {
           result = result + '등록된 리스너가 없습니다.\n ';
           setLogs(result);

          return;
      }

      Object.keys(listeners).forEach((eventName) => {
          // 해당 이벤트에 붙은 리스너 개수 (앞에 '$'가 붙어 나옵니다)
          const count = listeners[eventName].length;
          result = result + `이벤트: [${eventName.replace('$', '')}] -> 리스너 개수: ${count}개\n`;
      });
      
      setLogs(result);

      customLogger.info('==========================================');
  };


  /**
   * 쿠키활용
  */

   const searchCookies = async () => {
    const hideNotice = Cookies.get('hideNotice');

    const result =  `==== searchCookies : hideNotice ====> ${hideNotice}`;

    setLogs(result);
  };

  const saveCookies = async () => {
    
    // 현재시간 5분
    const now = new Date();
    now.setTime(now.getTime() + 5 * 60 * 1000);

    Cookies.set('hideNotice', 'true', { expires: now, secure: true });
    
    const result = '==== saveCookies : hideNotice ====> { expires: 1, secure: true }';
    setLogs(result);
  };

  /**단말기 조회 */
  const searchTerminal = async () => {
  
    // setLogs(result);
    if(!session) return;

    const storeId = session?.storeId;
    const terminalId = session?.terminalId;

    const res = await getTerminalInfo(storeId, terminalId);
    console.log('res >>>>> ', res);
    setLogs(JSON.stringify(res, null, 2));
  };

  /**단말기 수정 */
  const updateTerminalCall = async () => {
  
   // setLogs(result);
   if(!session) return;

   const storeId = session?.storeId;
   const terminalId = session?.terminalId;

   const params = {
       terminalName: 'main',
       terminalVersion: '1.1.0',
   };
  
   const res = await updateTerminal(storeId, terminalId, params);
   setLogs(JSON.stringify(res, null, 2)); 

  };

  /**주문-조회  */
  const searchOrders = async () => {
     
    // setLogs(result);
    if(!session) return;

    const storeId = session?.storeId;

    await getOpenAllOrders(storeId);
  };


  const localOrders = async () => {

    const params = {
      orders : openAllOrders,
      statusCounts: statusCounts,
    };

    setLogs(JSON.stringify(params, null, 2));
  };

  /**###### 주문-상태변경 */
  const updateOrderStatus = async () => {


    if(!orderId || !status) return;

    const targetOrder = await getOrderByPk(orderId);
    
    if (!targetOrder) {
      alert('존재하지 않거나 이미 삭제된 주문 확인필요..');
      return;
    }

    console.log('orderId >>>>> ', orderId);
    console.log('status >>>>> ', status);

    const baseParams:BaseOrderStatusRequest = {
      flowId: targetOrder.flowId,
      channelCode: targetOrder.channelCode as any,
      channelOrderId: targetOrder.channelOrderId,    
    };

    let res;

    switch (status) {
      case 'CONFIRM':
        res = await confirmOrderStatus(orderId, {
          ...baseParams,
          preparationMinute: 10,
        });
        break;

      case 'REFUSE':
        res = await refuseOrderStatus(orderId, {
          ...baseParams,
          orderCancelReason: 'SOLD_OUT', 
        });
        break;

      case 'READY':
        res = await readyOrderStatus(orderId, {
          ...baseParams,
        });
        break;

      case 'DELIVERY':
        res = await deliveryOrderStatus(orderId, {
          ...baseParams,
        });
        break;

      case 'COMPLETE':
        res = await completeOrderStatus(orderId, {
          ...baseParams,
        });
        break;

      case 'CANCEL':
        res = await cancelOrderStatus(orderId, {
          ...baseParams,
          orderCancelReason: 'SOLD_OUT', 
        });
        break;


      default:
        alert('지원하지 않는 상태값입니다.');
        return;
    }

    // 💡 4. 최종 결과 처리
    if (res?.success) {
      alert(`[성공] ${orderId}번 주문이 ${status}(으)로 변경되었습니다!`);
    } else {
      alert(`[실패] ${res?.message}`);
    }
    
  };

  // 상품목록조회
  const searchItems = async () => {
     
    if(!session) return;

    const storeId = session?.storeId;
    await getStoreItems(storeId);
  };

  // 상품-품절
  const soldoutItem = async () => {
     
    if(!session || !orderId) return;

    const storeId = session?.storeId;
    const res = await soldoutItemStatus(storeId, orderId);

    if (res?.success) {
      alert(`[성공] ${orderId}번 상품이 품절(으)로 변경되었습니다!`);
      await searchItems();
    } else {
      alert(`[실패] ${res?.message}`);
    }
  };

  // 상품-품절해제
  const avaliableItem = async () => {
     
    if(!session || !orderId) return;

    const storeId = session?.storeId;
    const res = await availableItemStatus(storeId, orderId);

    if (res?.success) {
      alert(`[성공] ${orderId}번 상품이 해제(으)로 변경되었습니다!`);
      await searchItems();
    } else {
      alert(`[실패] ${res?.message}`);
    }
  };

  // 상품-그룹추출
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const itemGroups: ItemGroup[] = storeItems?.itemGroups || [];

  const getItemGroups = async () => {

    if (itemGroups.length > 0 && selectedGroupId === null) {
      setSelectedGroupId(itemGroups[0].id);
    }
  };

  const currentItems = useMemo<ItemData[]>(() => {
    const selectedGroup = itemGroups.find(group => group.id === selectedGroupId);
    return selectedGroup ? selectedGroup.items : [];
  }, [itemGroups, selectedGroupId]);


  useEffect(() => {
     console.log('현재 currentItems: ', currentItems);
  }, [currentItems]); 

  
  

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2>API CALL 테스트</h2>

      <div className={`network-icon ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🌐 연결됨' : '⚠️ 오프라인 (결제주의)'}
       </div>

      {/* 주문 api */}
      <div style={{ marginBottom: '3px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>주문 번호 (orderId):</label>
        <input 
          type="number" 
          value={orderId} 
          onChange={(e) => setOrderId(e.target.value ? Number(e.target.value) : '')}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>변경할 상태:</label>
          <select 
            value={status} 
             onChange={(e) => setStatus(e.target.value as OrderStatus)}
           // onChange={(e) => console.log('>>>>> ', e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            {/* <option value="RECEIVE">접수 (RECEIVE)</option> */}
            <option value="CONFIRM">수락 (CONFIRM)</option>
            <option value="REFUSE">거절 (REFUSE)</option>
            <option value="READY">준비완료 (READY)</option>
            <option value="DELIVERY">배달 중 (DELIVERY)</option>
            <option value="COMPLETE">완료 (COMPLETE)</option>
            <option value="CANCEL">취소 (CANCEL)</option>
          </select>
           <button onClick={() => searchOrders()}>주문-api조회</button>
           <button onClick={() => localOrders()}>주문-로컬조회</button>
           <button onClick={() => updateOrderStatus()}>주문-상태변경</button>
      </div>
      
      {/* 버튼 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '3px' }}>
        <button onClick={ sendLokiLog }>로키 로그전송 테스트</button>

        <button onClick={ logActiveListeners }>소켓-리스너리스트확인</button>

        <button onClick={ searchCookies }>쿠키-조회</button>
        <button onClick={ saveCookies }>쿠키-저장</button>
        <button onClick={() => setLogs('')}>로그 초기화</button>


        <button onClick={() => searchTerminal()}>단말기-조회</button>
        <button onClick={() => updateTerminalCall()}>단말기-수정</button>

        <button onClick={() => searchItems()}>상품목록-조회</button>
       <button onClick={() => soldoutItem()}>상품-품절</button>
       <button onClick={() => avaliableItem()}>상품-품절해제</button>

       <button onClick={() => getItemGroups()}>상품목록-카테고리추출</button>

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

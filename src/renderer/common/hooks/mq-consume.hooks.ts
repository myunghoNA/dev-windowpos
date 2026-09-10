import { useEffect, useState } from 'react';

import { needElectron } from '@renderer/apis/need-electron.api';
//Import Helper
//# Import Service
import { dispatchMqEvent } from '@renderer/common/services/mq-event.service';
//# Import Type
import { MqMessage } from '@shared/types/mq.type';


/**
 * @description 애플리케이션의 메모리 사용량을 주기적으로 모니터링.
 *              Chrome 계열 브라우저의 성능 측정 API를 활용, 
 */
export const useMqListener = () => {
  const [mqStatus, setMqStatus] = useState<string>('DISCONNECTED');

  useEffect(() => {
    // 💡 Dispatcher 함수 연결
    const removeOnConsumeMessage = needElectron().rabbitmq.onConsumeMessage(
      (_event: any, message: MqMessage) => dispatchMqEvent(message),
    );

    const removeOnConnectStatus = needElectron().rabbitmq.onConnectStatus(
      (_event: any, status: string) => setMqStatus(status),
    );

    return () => {
      removeOnConsumeMessage();
      removeOnConnectStatus();
    };
  }, []);

  return { mqStatus };
};
import { BrowserWindow } from 'electron';

import { AmqpConnectionManager, ChannelWrapper, connect } from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
// Import Service
import { sendLogToRenderer, sendMqConnectStatus } from '@main/services';
import { MAIN_CHANNEL } from '@shared/constants';
//# Import Type
import { CurrentSession } from '@shared/types';


const ENV = import.meta.env;
const VITE_MQ_HOSTNAME = ENV.VITE_MQ_HOSTNAME;
const VITE_MQ_PORT = Number(ENV.VITE_MQ_PORT) || 5672;
const VITE_MQ_USERNAME = ENV.VITE_MQ_USERNAME;
const VITE_MQ_PASSWORD = ENV.VITE_MQ_PASSWORD;
const VITE_MQ_VHOST = ENV.VITE_MQ_VHOST;

const VITE_MQ_EXCHANGE = ENV.VITE_MQ_EXCHANGE || 'flow';
const VITE_MQ_PRERK_STORE = ENV.VITE_MQ_PRERK_STORE || 'flow.store.';
const VITE_MQ_PRERK_BRAND = ENV.VITE_MQ_PRERK_BRAND || 'flow.brand.';


const LOG_TITLE = '[MQ.SERVICE]';

const connections: Partial<Record<string, AmqpConnectionManager>> = {};

let activeChannelWrapper: ChannelWrapper | null = null;
let activeExchangeName: string | null = null;
let activeQueueName: string | null = null;
let setupPromise: Promise<ChannelWrapper> | null = null;


/**
 * @name setupRabbitMQService
 * @description 앱 시작 시 RabbitMQ 채널 및 커넥션 처리
 */
export function setupRabbitMQService(mainWindow: BrowserWindow, session:CurrentSession): Promise<ChannelWrapper> {

  setupPromise = (setupPromise ?? Promise.resolve(undefined as unknown as ChannelWrapper))
    .catch(() => undefined)
    .then(() => doSetup(mainWindow, session));

  return setupPromise;
}

async function doSetup(mainWindow: BrowserWindow, session:CurrentSession): Promise<ChannelWrapper> {
  
  if(!session?.storeId) {
    sendLogToRenderer(`${LOG_TITLE}[WARN] storeId not provided`, session );
  }

  // 기존에 열려있는 채널 정리 
  if (activeChannelWrapper) {
    try {
      if (activeExchangeName && activeQueueName) {
        await activeChannelWrapper.addSetup((channel: Channel) =>
          channel.unbindQueue(activeQueueName!, activeExchangeName!, ''),
        );
      }

      await activeChannelWrapper.close();
      sendLogToRenderer(`${LOG_TITLE}`, 'Previous channel closed and unbound.');

    } catch (err) {
      sendLogToRenderer(`${LOG_TITLE} Failed to cleanly close previous channel`, {
        error: String(err),
      });
    } finally {
      activeChannelWrapper = null;
      activeExchangeName = null;
      activeQueueName = null;
    }
  }

  const rabbitConfig = {
    hostname: VITE_MQ_HOSTNAME,
    port: VITE_MQ_PORT,
    username: VITE_MQ_USERNAME,
    password: VITE_MQ_PASSWORD,
    vhost: VITE_MQ_VHOST,
  };

  const isNewConnection = !connections[VITE_MQ_VHOST];

  if (isNewConnection) {
    connections[VITE_MQ_VHOST] = connect([rabbitConfig], {
      connectionOptions: {
        timeout: 5000,
      },
    });

    const connection = connections[VITE_MQ_VHOST]!;

    connection.on('connect', () => {
      sendLogToRenderer(`${LOG_TITLE}`, 'Connected successfully');
      sendMqConnectStatus('CONNECTED');
    });

    connection.on('disconnect', (err) => {
      sendLogToRenderer(`${LOG_TITLE} Disconnected. Retrying...`, {
        error: err.err?.message,
      });
      sendMqConnectStatus('RECONNECTING');
    });
  }

  const connection = connections[VITE_MQ_VHOST]!;

  // Exchange 이름과 매장 고유 Queue 이름 정의
  const QUEUE_NAME = String(session.terminalId);

  const channelWrapper = connection.createChannel({
    json: true,
    setup: async function (channel: Channel) { 

      // 임시: 개발용
      await channel.assertExchange(VITE_MQ_EXCHANGE, 'topic', { durable: true,  autoDelete: false  });

      //# Queue 생성
      await channel.assertQueue(QUEUE_NAME, {
        durable: true,
        //TODO: expires: 1000 * 60 * 60 * 24,
        expires: 1000 * 60,
        arguments: {
          'x-queue-type': 'classic',
        },
      });

      //# 라우팅 키 정의
      const ROUTING_KEYS = [
        `${VITE_MQ_PRERK_BRAND}${session.brandId}`,
        `${VITE_MQ_PRERK_STORE}${session.storeId}`,
      ];

      for (const routingKey of ROUTING_KEYS) {
        await channel.bindQueue(
          QUEUE_NAME,
          VITE_MQ_EXCHANGE,
          routingKey,
        );
      }

      //# Queue와 Exchange 바인딩
      await channel.bindQueue(QUEUE_NAME, VITE_MQ_EXCHANGE, '');

      //# 한 번에 1개의 메시지만 수신하도록 제한
      await channel.prefetch(1);

      //# 메시지 수신 (Consume)
      await channel.consume(QUEUE_NAME, (msg: ConsumeMessage | null) => {
        if (msg !== null) {
          const content = msg.content.toString();
          const receivedRoutingKey = msg.fields.routingKey;
          sendLogToRenderer(`${LOG_TITLE} Message Received [${receivedRoutingKey}]`, content);

          try {
            const parsedData = JSON.parse(content);
            // 렌더러로 데이터 전달
            mainWindow.webContents.send(MAIN_CHANNEL.rabbitmq.sendConsumeMessage, parsedData);

            // ack 후 다음 메시지 처리
            channel.ack(msg);
          } catch (error) {
            sendLogToRenderer(`${LOG_TITLE} JSON Parse Error`, { error: String(error), content });
            // requeue하지 않고 버림
            channel.nack(msg, false, false);
          }
        }
      });
    },
  });

  //  채널 레벨 에러(런타임 중 채널이 죽는 경우 등)를 잡는 핸들러 추가
  channelWrapper.on('error', (err, info) => {
    sendLogToRenderer(`${LOG_TITLE} Channel Error`, { error: err?.message, info });
  });

  try {
    await channelWrapper.waitForConnect();
    
    sendLogToRenderer(`${LOG_TITLE}`, 'Channel connected and ready.');
    sendMqConnectStatus('CONNECTED');
  } 
  catch (err) {
    sendLogToRenderer(`${LOG_TITLE} Channel setup failed`, { error: String(err) });
    sendMqConnectStatus('DISCONNECTED');
    
    activeChannelWrapper = null;
    activeExchangeName = null;
    activeQueueName = null;
    throw err;
  }

  activeChannelWrapper = channelWrapper;
  activeExchangeName = VITE_MQ_EXCHANGE;
  activeQueueName = QUEUE_NAME;

  return channelWrapper;
}


/**
 * @name closeRabbitMQService
 * @description 앱 종료 시 RabbitMQ 채널 및 커넥션을 해제처리
 */
export async function closeRabbitMQService() {
  try {
    //# 활성화된 채널 닫기 
    if (activeChannelWrapper) {
      await activeChannelWrapper.close();
      activeChannelWrapper = null;
      activeExchangeName = null;
      activeQueueName = null;
      sendLogToRenderer(`${LOG_TITLE}`, 'Channel closed gracefully.');
    }

    //# 전체 커넥션 끊기
    const connection = connections[VITE_MQ_VHOST];
    if (connection) {
      await connection.close();
      delete connections[VITE_MQ_VHOST];
      sendLogToRenderer(`${LOG_TITLE}`, 'Channel closed gracefully.');
    }

    sendMqConnectStatus('DISCONNECTED');
  } catch (error) {
    sendLogToRenderer(`${LOG_TITLE} Shutdown Error`, String(error));
  }
}

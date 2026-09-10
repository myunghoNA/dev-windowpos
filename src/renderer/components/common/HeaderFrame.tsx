import React from 'react';

import { needElectron } from '@renderer/apis/need-electron.api';
import { useAppDispatch, useAppSelector } from '@renderer/redux/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';

import { useMqListener } from '@renderer/common/hooks/mq-consume.hooks';
import { useNetworkStatus } from '@renderer/common/hooks/network-check.hooks';
//# Import Slice
import { ClearSession } from '@renderer/redux/common/session.slice';
//# Import Service
import { closeStore, openStore, pauseStore } from '@renderer/common/services';
//# Import DB
import { businessDB } from '@renderer/common/repositories/localdb';
import { getStoreOperation } from '@renderer/common/repositories/store-operation.repository';
//# Import Helper
import { customLogger, getAddHours } from '@renderer/common/helpers';
import { StoreClosedReson } from '@renderer/providers/com-code.provider';
//# Import Type
import { LangType } from '@shared/types';
import { PauseStoreRequest } from '@shared/types/store.type';

const ENV_MODE = import.meta.env.MODE;

export default function HeaderFrame(): JSX.Element {
    const LOG_TITLE = '[renderer.headerFrame]';

    const dispatch = useAppDispatch();
    const session = useAppSelector((state) => state.session.current);

    const storeOperation = useLiveQuery(
        () => session?.storeId ? getStoreOperation(session.storeId) : undefined,
        [session?.storeId],
    );

    // MQ 구독 시작
    const { mqStatus } = useMqListener();
    const { t, i18n } = useTranslation();

    // 네트워크 상태 구독
    const networkStatus = useNetworkStatus();


    /**
       * 창 최대화/최소화/창닫기 액션 처리
       */
    const handleWindowControl = (contorlId: 'maximize' | 'minimize' | 'close') => {
        needElectron().common.sendAppControlAction(contorlId);
    };

    /**
       * 새로고침
       */
    const handleWindowReload = () => {
        window.location.reload();
    };

    /**
       * 언어변경
       */
    const changeLanguage = (langType: LangType) => {
        i18n.changeLanguage(langType);

        //메인에 전달
        needElectron().common.sendSetLangType(langType);
    };

    /** 마감 */
    const changeClose = async () => {
        //TODO: 추후 확인후
        const reason = StoreClosedReson.OTHER;
        const res = await closeStore(session!.storeId, reason);
        console.log('@@@@ 마감:::: res ::: ', res);
    };

    /** 개점 */
    const changeOpen = async () => {

        const res = await openStore(session!.storeId);
        console.log('@@@@ 개점:::: res ::: ', res);
    };

    /** 일시중지 */
    const changePause = async () => {

        const params:PauseStoreRequest = {
           closedReason: StoreClosedReson.OTHER,
           closedUntil: getAddHours(3),
        };

        const res = await pauseStore(session!.storeId, params);
        console.log('@@@@ 일시중지:::: res ::: ', res);

    };


    /**
       * 임시 로그아웃
    */
    const handleLogOut = async() => {

        try {
            const rabbitResult = await needElectron().rabbitmq.disConnectRabbitmq();
            if (rabbitResult.isSuccess) {
               customLogger.info(`${LOG_TITLE} RabbitMQ 해제 성공`);
            }
            else{
               customLogger.info(`${LOG_TITLE} RabbitMQ 해제 실패: `, rabbitResult.errorMessage);
            }
        } catch (e) {
            customLogger.error(`${LOG_TITLE} RabbitMQ 연결 해제 실패`, e);
        }

        try {
            await businessDB.resetData();
            customLogger.info(`${LOG_TITLE} 로컬 비즈니스 DB 초기화 완료`);
        } catch (e) {
            customLogger.error(`${LOG_TITLE} 로컬 비즈니스 DB 초기화 실패`, e);
        }

        dispatch(ClearSession());
    };
   
    return (
        <div id="titlebar" style={styles.titlebar}>
            <div className="logo-section"> Logo</div>
            <div style={styles.windowControls}>

                <button>Net:{networkStatus === 'online' ? t('status.online') : t('status.offline')}</button>
                <button>ID:{session?.storeId}</button>
                <button>MQ:{mqStatus}</button>
                <button >상태:{storeOperation?.operate?.storeStatus || ''}</button>

                <button onClick={() => changeClose()}>마감</button>
                <button onClick={() => changeOpen()}>개점</button>
                <button onClick={() => changePause()}>일시중지</button>
                {
                    ENV_MODE === 'dev' && 
                       <button onClick={() => changeLanguage('ko')}>ko</button>
                }
                <button onClick={() => changeLanguage('en')}>en</button>
                <button onClick={() => changeLanguage('ar')}>ar</button>

                <button id="minimize" onClick={() => handleLogOut()}>로그아웃</button>
                

                <button id="minimize" onClick={() => handleWindowControl('minimize')}>-</button>
                <button id="maximize" onClick={() => handleWindowControl('maximize')}>⬜</button>
                <button id="close" onClick={() => handleWindowControl('close')}>X</button>
                <button id="reload" onClick={() => handleWindowReload()}>@</button>
            </div>
            
        </div>
    );
}


// 별도 설치 없이 사용하는 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
    titlebar: {
        display: 'flex',
        justifyContent: 'space-between', 
        alignItems: 'center',
        height: '32px',
        backgroundColor: '#222',
        WebkitAppRegion: 'drag',
    } as any,
    windowControls: {
        display: 'flex',
        gap: '10px', 
        WebkitAppRegion: 'no-drag',
    } as any,
};
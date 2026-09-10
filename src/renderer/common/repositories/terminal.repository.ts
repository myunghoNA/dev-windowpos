import uuid from 'react-uuid';

//# Import Helper
import { customLogger, getToday, withLogging } from '@renderer/common/helpers';
import { getTerminalInfo, registerTerminal } from '@renderer/common/services/terminal.service';
//# Import DB
import { systemDB } from '@renderer/common/repositories/localdb';
//# Import Type
import { TerminalRegistry } from '@shared/types';

/**
 * 해당 PC의 단말기 등록 조회
 * @returns 일치하는 TerminalRegistry, 없으면 undefined
 */
export function getTerminalRegistry(storeId: number) {
  return systemDB.terminalRegistry.get(storeId);
}

/**
 * 해당 PC에서 단말기 최초 등록시 저장 
 */
export async function putTerminalRegistry(registry: TerminalRegistry): Promise<void> {
  await systemDB.terminalRegistry.put(registry);
}


/**
 * 기존 등록의 특정 필드만 부분 수정
 */
export async function updateTerminalRegistry(
  storeId: number, 
  changes: Partial<TerminalRegistry>,
): Promise<number> {
  return systemDB.terminalRegistry.update(storeId, changes);
}


/**
 * 로컬 DB에 등록된 단말기 ID 확인후 등록
 */
export const setupTerminalId = withLogging(
  'setupTerminalId',
  async (storeId: number, brandId: number, isCsMode:boolean): Promise<string> => {

    console.log('storeId >>>>>>>>>>>>>>>>>>>>>>>>>> ', storeId);

    const LOG_TITLE = '[setupTerminalId]';
    const registry = await getTerminalRegistry(storeId);

    let currentTerminalId = '';
    
    //# 기존 단말기 존재
    if (registry) {
      if (registry.brandId !== brandId) {
        await updateTerminalRegistry(storeId, { brandId });
        customLogger.info(`${LOG_TITLE} brandId 갱신 완료 (${registry.brandId} -> ${brandId})`);
      } else {
        customLogger.info(`${LOG_TITLE} 기존 단말기 재사용: ${registry.terminalId}`);
      }

      currentTerminalId = registry.terminalId;
    }
    //# 신규 (최초1번) 
    else{

      const timestamp = getToday('YYYYMMDDHHmmss');
      const randomStr = uuid().slice(0, 4);

      // CS 구분
      if(isCsMode){
        currentTerminalId = `pos-window-cs-${storeId}-${timestamp}-${randomStr}`;
      }else{
        currentTerminalId = `pos-window-${storeId}-${timestamp}-${randomStr}`;
      }
      
      await putTerminalRegistry({
        brandId,
        storeId,
        terminalId: currentTerminalId,
        registerDt: getToday('YYYY-MM-DD HH:mm:ss'),
      });

      customLogger.info(`${LOG_TITLE} 신규 단말기 발급 완료: ${currentTerminalId} (cs모드 : ${isCsMode})`);
    }

    //# 서버 연동처리
    try {
       const res = await getTerminalInfo(storeId, currentTerminalId);
      
      if (res.code === 'NOT_FOUND') {
        // 서버에 미등록 상태
        customLogger.info(`${LOG_TITLE} 미등록된 단말기입니다. 등록을 진행합니다.`);
        const res = await registerTerminal(storeId, {
          terminalId: currentTerminalId,
          terminalName: isCsMode ? 'CS' : 'MAIN', 
          terminalType: 'POS_WINDOW',
          terminalVersion: import.meta.env.VITE_APP_VERSION,
        });

        if(res.code === 'SUCCESS') {
          customLogger.info(`${LOG_TITLE} 단말기 등록 완료`, res);
        }
      }
    } catch (e) {
      customLogger.error(`${LOG_TITLE} 서버 통신 실패로 단말기 등록 상태를 확인하지 못했습니다.`, e);
    }

    return currentTerminalId;
  },
);
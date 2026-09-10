import Swal from 'sweetalert2';

import { needElectron } from '@renderer/apis/need-electron.api';
import { NotificationType } from '@renderer/providers/com-code.provider';
import { SOUND_FILES } from '@renderer/providers/com-item.provider';
//# Helper
import i18n from '@renderer/common/helpers/i18n.helper';
import { customLogger } from '@renderer/common/helpers/logger.helper';
//# Type
import { SoundType } from '@shared/types';

let isPopupOpen = false;

export const SweetAlert = {
  /**
   * [Info] 단순 정보 알림 (성공/안내)
   */
  info: (title: string, text: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonColor: '#3085d6',
      confirmButtonText: '확인',
    });
  },

  /**
   * [Warn] 단순 정보 알림 (성공/안내)
   */
  warn: (title: string, text: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#f8bb86',
      confirmButtonText: '확인',
    });
  },

  /**
   * [Error] 중복 방지 에러 알림 (장애 발생)
   */
  error: async (title: string, message: string) => {

    if(isPopupOpen) return;
    
    isPopupOpen = true;
    try {
      
      const result = await Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonColor: '#d33',
        confirmButtonText: '확인',
        allowOutsideClick: false, // 실수로 배경 클릭해서 닫히는 것 방지
      });
      
      return result;
    } finally {
      isPopupOpen = false; 
    }

  },

  /**
   * [Confirm] 사용자 선택 (예/아니오)
  */
  confirm: async (title: string, text: string): Promise<boolean> => {
    const result = await Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      allowOutsideClick: false,
    });
    return result.isConfirmed;
  },

  /**
   * [Fire] 단순 정보 알림 (성공/안내)
   */
  fire: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      timer: 2000,
    });
  },
};


/**
 * @name playAudio
 * @description 지정된 사운드 ID와 볼륨으로 오디오를 재생
 * @param {SoundType} soundId - 재생할 알림음의 고유 ID
 * @param {number} volume - 재생 볼륨 (0 ~ 100 사이의 숫자)
 */
export function playAudio(soundId: SoundType, volume: number): void {

  if(volume < 1) return;

  const audioPath = SOUND_FILES[soundId || 'DEFAULT'];

  if (!audioPath) {
    customLogger.warn(`해당 알림음에 매핑된 파일이 없습니다: ${soundId}`);
    return;
  }

  try {
    const audio = new Audio(audioPath);
    
    const safeVolume = Math.min(100, Math.max(0, volume)); 
    audio.volume = safeVolume / 100;

    audio.play().catch((error) => {
      customLogger.error(`미리듣기 오디오 재생 실패 [${soundId}]:`, error);
    });
  } catch (error) {
    customLogger.error(`Audio 객체 생성 실패 [${soundId}]:`, error);
  }
  
}

/**
 * @name sendOsNotification
 * @description OS(윈도우) 시스템 팝업 알림을 메인에 발송
 * @param {string} title - 알림 제목
 * @param {string} body - 알림 내용
 */
export async function sendOsNotification(type: NotificationType, customBody?:string): Promise<void> {
  try {
    let title = '';
    let body  = '';

    if(type === NotificationType.NEW_ORDER){
      
      title = i18n.t('notification.new_order.title', { 
        defaultValue: i18n.t('notification.default.title'), 
      });
      
      body = customBody || i18n.t('notification.new_order.body', {
        defaultValue: i18n.t('notification.default.body'),
      });
    }

    const payload = { type, title, body };

    await needElectron().alarm.sendNotification(payload);
    
    customLogger.info('[OS Notification] 발송 성공:', payload);
  } catch (error) {
    customLogger.error('[OS Notification] 발송 실패:', error);
  }
}
import { NotificationType } from '@renderer/providers/com-code.provider';

export type SoundType = 'DEFAULT' | string; // 알림음 종류 확장 시 유니온 늘리거나 서버 목록과 매칭

/**
 * @description Window 앱 알림 제목 및 메시지
 */
export type NotificationInfo = {
  type: NotificationType
  title: string;
  body: string;
};

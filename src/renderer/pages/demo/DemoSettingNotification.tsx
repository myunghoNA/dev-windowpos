import { useAppSelector } from '@renderer/redux/hooks';
import { useLiveQuery } from 'dexie-react-hooks'; // ✅ 추가
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

//# Import Repository
import {
  getSettingNotificationByKey,
  saveSettingNotification,
} from '@renderer/common/repositories/setting-notification.repository';
//# Import Helper
import { customLogger, isEmpty, playAudio, sendOsNotification, SweetAlert } from '@renderer/common/helpers';
//# Import Type
import { SettingNotification } from '@shared/types/setting.type';
//# Import Provider
import { NotificationType } from '@renderer/providers/com-code.provider';
import { InitSettingNotification } from '@renderer/providers/com-item.provider';


export function DemoSettingNotification() {

  const LOG_TITLE  = '[renderer.demoSettingNotification]';

  const session = useAppSelector((state) => state.session.current);

  const settingNotification = useLiveQuery(
    async () => {
      console.log('useLiveQuery >>> ', session);
      if (!session?.terminalId) return undefined;
      return getSettingNotificationByKey(session.terminalId, 'NEW_ORDER');
    },
    [session?.terminalId],
  );

  const [ curSettingST, setCurSetting ] = useState<SettingNotification>(InitSettingNotification);

  const { t } = useTranslation();

  /** 초기설정 */
  useEffect(() => {
    console.log('세션값 :::::::: ', session);
    if(settingNotification) {              
      setCurSetting(settingNotification);
    }
    else{
      setCurSetting(InitSettingNotification);
    }
  }, [settingNotification]);


  /**Form Value변경 반영 - 변경사항 없음 */
  const handleFormValueChange = (event, formId:string) => {
    switch (formId) {
      case 'isUse': {
        const isChecked = (event.target as HTMLInputElement).checked;
        setCurSetting({
          ...curSettingST,
          isUse: isChecked,
        });
        break;
      }
      case 'soundId': {
        setCurSetting({
          ...curSettingST,
          soundId: event.target.value,
        });
        break;
      }
      case 'soundVolume':
        setCurSetting({
          ...curSettingST,
          soundVolume: Number(event.target.value),
        });
      break;
      case 'isOsPopup': {
        const isChecked = (event.target as HTMLInputElement).checked;
        setCurSetting({
          ...curSettingST,
          isOsPopup: isChecked,
        });
        break;
      }
    }
  };

  /** 알림 미리듣기 */
  const handleSoundPlay = (targetOption: SettingNotification) => {  

    if (targetOption) {
      const soundId = targetOption.soundId || 'DEFAULT';
      const volume = !isEmpty(targetOption.soundVolume) ? targetOption.soundVolume : 100;

      playAudio(soundId, volume);
    }
  };

  /** OS알림 미리보기 - 변경사항 없음 */
  const handleOsPopupView = (type: NotificationType) => {

    let isOsPopup = false;

    if (type === NotificationType.NEW_ORDER) {
      isOsPopup = curSettingST?.isOsPopup || false;
    }
    else if (type === NotificationType.SYSTEM) {
      isOsPopup = curSettingST?.isOsPopup || false;
    }

    if (!isOsPopup) return;

    sendOsNotification(type);
  };

  /** 설정정보 저장 */
  const handleSaveSetting = async () => {

    if(!session){
        SweetAlert.error('인증없음', '로그인해주세요');
        return;
    }


    const copyCurSetting: SettingNotification = {
      ...curSettingST,
      terminalId:session.terminalId,
    };

    try {

        await saveSettingNotification(copyCurSetting);

        customLogger.info(`${LOG_TITLE} 설정 저장`, copyCurSetting);
    } catch (error) {
        customLogger.error(`${LOG_TITLE} 설정 저장 실패`, error);
    }
  };

 return (
    <div style={styles.notificationSettings}>
      {/* 타이틀 영역 */}
      <h2 style={styles.settingsTitle}>알림음 설정</h2>


      {/* 설정 컨테이너 */}
      <div>

        {/* [1] 포스 대면 주문 설정 블록 */}
        <div style={styles.settingsCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>신규주문알림</span>
            <input 
                type="checkbox" 
                checked={curSettingST?.isUse || false} 
                onChange={(e) => handleFormValueChange(e, 'isUse')} 
              />
          </div>

          <div>
            {/* 알림음 선택 */}
            <div style={styles.controlRow}>
              <label style={styles.controlLabel}>알림음</label>
              <div style={styles.controlGroup}>
                <div style={styles.soundSelectGroup}>
                  <select 
                    style={styles.customSelect}
                    value={curSettingST?.soundId || 'DEFAULT'} 
                    onChange={(e) => handleFormValueChange(e, 'soundId')}
                  >
                    <option value="DEFAULT">기본</option>
                  </select>
                  <button style={styles.iconButton} aria-label="미리듣기" onClick={() =>handleSoundPlay(curSettingST)}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M12 4L8 8H4v8h4l4 4V4zm3.5 4v8a6 6 0 0 0 0-8zm1.5-2.5v13a8.5 8.5 0 0 0 0-13z"/>
                    </svg>
                  </button>
                </div>
                
              </div>
            </div>

            <div style={styles.controlRow}>
              <label style={styles.controlLabel}>음량</label>
              <div style={styles.volumeGroup}>
                <div style={styles.rangeSliderWrapper}>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="25" 
                    value={curSettingST?.soundVolume || 100} 
                    onChange={(e) => handleFormValueChange(e, 'soundVolume')}
                    style={styles.customRange} 
                    className="volume-slider" 
                  />
                  <div style={styles.rangeLabels}>
                    <span style={styles.rangeLabelSpan} className="range-step">0</span>
                    <span style={styles.rangeLabelSpan} className="range-step">25</span>
                    <span style={styles.rangeLabelSpan} className="range-step">50</span>
                    <span style={styles.rangeLabelSpan} className="range-step">75</span>
                    <span style={styles.rangeLabelSpan} className="range-step">100</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* [2] OS 알림센터(팝업) 사용 설정 블록 */}
        <div style={styles.settingsCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>OS 알림 (윈도우 팝업) 사용</span>

            {
              curSettingST?.isOsPopup && 
                <button onClick={() =>handleOsPopupView(NotificationType.NEW_ORDER)}>
                  확인
                </button>
            }

            <input 
                type="checkbox" 
                checked={curSettingST?.isOsPopup || false} 
                onChange={(e) => handleFormValueChange(e, 'isOsPopup')} 
              />
          </div>
        </div>

      </div>

      {/* 하단 액션 */}
      <div style={styles.footer}>
        <button onClick={ handleSaveSetting }>
          { /**저장 */ t('common.save') }
        </button>
      </div>
    </div>
  );
}

// 임시 Css
const styles: Record<string, React.CSSProperties> = {
  notificationSettings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#333',
    maxWidth: '800px',
    padding: '24px',
  },
  settingsTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  infoBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '32px',
    fontSize: '14px',
    color: '#475569',
  },
  infoBannerIcon: {
    fontSize: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  settingsCard: {
    marginBottom: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
  },
  toggleSwitch: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '26px',
  },
  toggleSwitchInput: {
    opacity: 0,
    width: '0',
    height: '0',
  },
  toggleSwitchSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#cbd5e1',
    transition: '.3s',
    borderRadius: '26px',
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '28px',
  },
  controlLabel: {
    width: '100px',
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 500,
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  soundSelectGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  customSelect: {
    padding: '10px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    minWidth: '160px',
    outline: 'none',
    background: 'white',
    cursor: 'pointer',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
    marginLeft: '20px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
  },
  radioInput: {
    display: 'none',
  },
  // 주의: :checked 상태일 때 테두리 색상 변경 및 ::after 파란색 원 생성은 CSS 파일 필요
  radioCustom: {
    width: '18px',
    height: '18px',
    border: '2px solid #cbd5e1',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s',
  },
  volumeGroup: {
    display: 'flex',
    flex: 1,
    paddingTop: '10px',
  },
  rangeSliderWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '500px',
  },
  // 주의: ::-webkit-slider-thumb 가상 요소는 인라인 스타일로 지원되지 않으므로 CSS 파일 필요
  customRange: {
    WebkitAppearance: 'none',
    width: '100%',
    height: '4px',
    background: '#e2e8f0',
    borderRadius: '2px',
    outline: 'none',
    position: 'relative',
    zIndex: 2,
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    fontSize: '13px',
    color: '#64748b',
    position: 'relative',
    zIndex: 1,
  },
  // 주의: ::before 가상 요소를 이용한 슬라이더 트랙의 동그라미 표시는 CSS 파일 필요
  rangeLabelSpan: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    width: '24px',
  },

    footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '4px',
  },
};
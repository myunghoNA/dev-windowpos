import { needElectron } from '@renderer/apis/need-electron.api';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { I18N_RESOURCES } from '@shared/locales';
import { en } from '@shared/locales/en.locale';
import { LangType } from '@shared/types';


/**
 * @module i18next
 * @description i18next 내장 모듈 전역 타입 확장
 *              t('common.save')처럼 키값을 입력할 때 엄격한 타입 추론과 자동완성을 보장
 */
declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: typeof en;
        };
    }
}

const customLanguageDetector = new LanguageDetector();

customLanguageDetector.addDetector({
  name: 'customDefault',
  lookup() {
    return 'en'; 
  },
  cacheUserLanguage() {},
});



const applyLanguageSettings = (lng: LangType) => {
  // 1. 화면 방향(RTL/LTR) 세팅
  const direction = lng === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = direction;
  document.body.className = direction;
  
  // 2. Main 프로세스로 언어값 동기화
  needElectron().common.sendSetLangType(lng);
};

// ===========================================
//  렌더러 i18n 엔진 및 플러그인 초기화
// ===========================================
i18n
  .use(customLanguageDetector)
  .use(initReactI18next)
  .init({
    resources: I18N_RESOURCES,
    debug: false,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      // 1순위: localStorage 확인 ➡️ 2순위: 커스텀 디텍터 실행 (navigator 완전 제외)
      order: ['localStorage', 'customDefault'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })
  .then(() => {
    // 최초 실행 시 적용
    const initialLang = (i18n.language || i18n.resolvedLanguage || 'en') as LangType;
    applyLanguageSettings(initialLang);
  });


// ===========================================
//  글로벌 이벤트 리스너 (RTL / LTR 동적 렌더링 가드)
// ===========================================
i18n.on('languageChanged', (lng:LangType) => {
  applyLanguageSettings(lng);
});



export default i18n;
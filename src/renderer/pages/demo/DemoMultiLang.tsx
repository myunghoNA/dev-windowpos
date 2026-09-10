import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { needElectron } from '@renderer/apis/need-electron.api';
// Import Hooks
import { usePagePerformance } from '@renderer/common/hooks';
// Import Helper
import { formatCurrency, formatLocaleDate } from '@renderer/common/helpers';

import {
  LangType,
} from '@shared/types';



export function DemoMultiLang() {

  const LOG_TITLE  = 'DemoMultiLang';
  // 성능측정
  usePagePerformance(LOG_TITLE);

  const [lang, setLang] = useState<string>('');
  const [logs, setLogs] = useState<string>('');

  const { t, i18n } = useTranslation();

  useEffect(() => {

    let price = formatCurrency(5000, 'ko-KR', true);

    if(lang === 'ar'){
       price = formatCurrency(5000, 'ar-SA' , true); 
    }
    else if(lang === 'en'){
       price = formatCurrency(5000, 'en-US', true);
    }

    const ksaNow = new Date();

    const ksaHijri    = formatLocaleDate(ksaNow, 'ar-SA', { isHijri: false });
    const ksaDateOnly = formatLocaleDate(ksaNow, 'ar-SA', { 
      isHijri: true, 
      showTime: false, 
    });


    let result =  `common.emergency > ${t('common.emergency')}\n`;
        result = result + `status.offline > ${t('status.offline')}\n`;
        result = result + `common.confirm > ${t('common.confirm')}\n`;

        result = result + `status.pending_count > ${t('status.pending_count', { count: 5 })}\n`;

        result = result + '------------------------------- \n';
        result = result + `price  > ${price}\n`;

        result = result + '------------------------------- \n';

        result = result + `ksaHijri  > ${ksaHijri}\n`;
        result = result + `ksaDateOnly  > ${ksaDateOnly}\n`;


    setLogs(result);
    
  }, [lang]);

  // 언어변경
  const changeLanguage = (langType: LangType) => {
    i18n.changeLanguage(langType);
    setLang(langType);

    //메인에 전달
    needElectron().common.sendSetLangType(langType);
  };
  

  const getBtnStyle = (lang: string) => ({
    padding: '8px 12px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    backgroundColor: i18n.language === lang ? '#007bff' : '#fff',
    color: i18n.language === lang ? '#fff' : '#000',
  });

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2>다국어</h2>
      
      {/* 버튼 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
        <button style={getBtnStyle('ko')} onClick={() => changeLanguage('ko')}>한국어</button>
        <button style={getBtnStyle('en')} onClick={() => changeLanguage('en')}>English</button>
        <button style={getBtnStyle('ar')} onClick={() => changeLanguage('ar')}>사우디</button>
      </div>

      {/* 결과 표시 영역 **/}
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
        
         <p>تم استلام طلب لـ 3 Pepsi.</p>

        <p dir="rtl" style={{ textAlign: 'right' }}>
          تم استلام طلب لـ 3 Pepsi.
        </p>

    </div>
  );
}

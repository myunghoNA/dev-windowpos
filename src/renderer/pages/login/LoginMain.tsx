import React, { useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@renderer/redux/hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
//# Import Constants
import { STORAGE_KEYS } from '@shared/constants/storage-key.constant';
//# Import Slice
import { SetSession } from '@renderer/redux/common/session.slice';
import { LoginStore } from '@renderer/redux/store/store-login.slice';
//# Import Helper
import { customLogger, delay, getApiErrorMessage, isCsAccount, SweetAlert } from '@renderer/common/helpers';


export default function LoginMain(): JSX.Element {
  
  const LOG_TITLE  = '[renderer.loginMain]';
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isLoading, resCode } = useAppSelector((state) => state.login);

  const [loginId, setLoginId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRememberId, setIsRememberId] = useState<boolean>(false);
  const [ isCsCheckMode, setIsCsCheckMode ] = useState<boolean>(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  /**
   * 초기설정
   */
  useEffect(() => {
    const initLoginStatus = async () => {
      const savedId = localStorage.getItem(STORAGE_KEYS.AUTH_LOGIN_ID);
      
      if (savedId) {
        setLoginId(savedId);
        setIsRememberId(true);
        
        await delay(100); 
        passwordInputRef.current?.focus();
      }
    };

    initLoginStatus();
  }, []);

  /**
   * 로그인
   * - 서버 인증 후 최소한의 세션(storeId, token)만 저장
   * - terminalId 등 나머지 세션 정보는 이후 (라우트 진입 시 공통 실행)
   */
  const handleLogin = async () => {
    
    //TODO: 추후 메시지표시 추가
    if (!loginId || !password) {
      SweetAlert.warn(t('warn.title'), t('warn.required_login'));
      return;
    }

    customLogger.info(`${LOG_TITLE} 로그인 요청: ${loginId}`);

    const result = await dispatch(LoginStore({ loginId, password }));

    if (LoginStore.rejected.match(result)) {
      const errorPayload = result.payload as any;
      const errorCode = errorPayload?.code || null;

      const errorMessage:any = getApiErrorMessage(errorCode, t);
      SweetAlert.warn(t('warn.title'), errorMessage);
      return;
    }

    if (!LoginStore.fulfilled.match(result)) {
      return;
    }

    const { brandId, storeId, token } = result.payload;
    const isCsMode = isCsAccount(password, storeId) || isCsCheckMode;

    customLogger.info(`${LOG_TITLE} 서버 인증 성공 - storeId: ${storeId}, isCsMode: ${isCsMode}`);

    // 최소 세션만 저장 
    dispatch(SetSession({
      brandId: brandId,
      storeId: storeId,
      terminalId: '',
      loginId: loginId,
      accessToken: token,
      storeNm: '',
      isCsMode: isCsMode,
    }));

    // 아이디 기억 처리
    if (isRememberId) {
      localStorage.setItem(STORAGE_KEYS.AUTH_LOGIN_ID, loginId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_LOGIN_ID);
    }

    customLogger.info(`${LOG_TITLE} 로그인 및 최소 세션 저장 완료`);
    navigate('/demo', { replace: true });

  };

  /**
   * 엔터 키 입력 시 로그인 처리 
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };


  return (
    <div>
      <input
        type="text"
        placeholder="아이디"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus={!isRememberId}
      />
      <input
        type="password"
        placeholder="패스워드"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={passwordInputRef}
      />

      <label>
        <input
          type="checkbox"
          checked={isRememberId}
          onChange={(e) => setIsRememberId(e.target.checked)}
        />
        아이디 기억
      </label>

      <label>
        <input
          type="checkbox"
          checked={isCsCheckMode}
          onChange={(e) => setIsCsCheckMode(e.target.checked)}
        />
        CS 점검모드
      </label>

      {resCode && resCode !== 'SUCCESS' && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          { getApiErrorMessage(resCode, t) }
        </p>
      )}
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </div>
  );
}
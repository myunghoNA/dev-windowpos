import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

//# Import Components
import { RedirectIfAuthed, RequireAuth } from '@renderer/components/auth/SessionCheck';
import { SessionInit } from '@renderer/components/auth/SessionInit';
import { DemoView } from '@renderer/pages/DemoView';
import MiniWidget from '@renderer/pages/MiniWidget';
import LoginMain from '@renderer/pages/login/LoginMain';


export function RouterView(): JSX.Element {

  return (

    <Routes>
      {/* 인증 안 됐을 때만 접근 가능한 라우트 */}
      <Route element={<RedirectIfAuthed />}>
        <Route path="/login" element={<LoginMain />} />
      </Route>

      {/* 인증 필요한 라우트 */}
      <Route element={<RequireAuth />}>
        {/* 세션초기세팅 필요한 라우트 */}
        <Route element={<SessionInit />}>
          <Route path="/demo" element={<DemoView />} />
        </Route>
        <Route path="/mini-widget" element={<MiniWidget />} />
      </Route>

      <Route path="/" element={<Navigate to="/demo" replace />} />
    </Routes>
  );
}

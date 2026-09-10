import React from 'react';

import { useAppSelector } from '@renderer/redux/hooks';
import { Navigate, Outlet } from 'react-router-dom';


/** 로그인 필요한 라우트 - 세션 없으면 /login으로 리다이렉트 */
export function RequireAuth() {
  const session = useAppSelector((state) => state.session.current);
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}


/** 이미 로그인된 상태면 시작화면 으로 리다이렉트 */
//TODO: 추후
export function RedirectIfAuthed() {
  const session = useAppSelector((state) => state.session.current);
  return session ? <Navigate to="/demo" replace /> : <Outlet />;
}
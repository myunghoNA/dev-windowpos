import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { CurrentSession } from '@shared/types';

interface SessionState {
  current: CurrentSession | null;
}

const initialState: SessionState = { current: null };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    /** 로그인 성공 시 현재 세션 정보를 저장. */
    SetSession: (state, action: PayloadAction<CurrentSession>) => {
      state.current = action.payload;
    },
    /** 로그아웃 시 세션을 비운다. */
    ClearSession: (state) => {
      state.current = null;
    },
  },
});

export const { SetSession, ClearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
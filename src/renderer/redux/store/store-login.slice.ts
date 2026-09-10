import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { StoreAPI } from '@renderer/apis/store.api';
//# Import type
import { LoginData, LoginRequest } from '@shared/types/auth.type';
import { ApiError } from '@shared/types/common.type';

/**
 * 로그인 API 호출
 */
export const LoginStore = createAsyncThunk<LoginData, LoginRequest, { rejectValue: ApiError }>(
  'post:/api/stores/login',
  async (param, { rejectWithValue }) => {
    try {
      const res = await StoreAPI.login(param);
      
      if (!res.success) {
        return rejectWithValue({ code: res.code, message: res.message });
      }
      return res.data;
      
    } catch (error: any) {
      // Axios 인터셉터나 공통 함수에서 던진 에러 캐치
      return rejectWithValue({
        code: error?.code || 'UNKNOWN_ERROR',
        message: error?.message || 'Network Error',
      });
    }
  },
);

export type LoginState = {
  isLoading: boolean;
  resCode: string | null;
  error: string | null;
};

const initialState: LoginState = {
  isLoading: false,
  resCode: null,
  error: null,
};

export const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    ResetLoginError: (state) => {
      state.resCode = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(LoginStore.pending, (state) => {
        state.isLoading = true;
        state.resCode = null;
        state.error = null;
      })
      .addCase(LoginStore.fulfilled, (state) => {
        state.isLoading = false;
        state.resCode = 'SUCCESS';
        state.error = null;
      })
      .addCase(LoginStore.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.resCode = action.payload.code;
          state.error = action.payload.message;
        } else {
          state.resCode = 'UNKNOWN_ERROR';
          state.error = action.error.message || '로그인에 실패했습니다.';
        }
      });
  },
});

export const { ResetLoginError } = loginSlice.actions;
export default loginSlice.reducer;
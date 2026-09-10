import { combineReducers, configureStore, Middleware } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
//# Import Helper
import { EXPECTED_ERROR_CODES } from '@renderer/common/helpers/api.helper';
import { customLogger } from '@renderer/common/helpers/logger.helper';
//# Import Slice
import sessionReducer from '@renderer/redux/common/session.slice';
import loginReducer from '@renderer/redux/store/store-login.slice';


const APP_MODE = import.meta.env.VITE_APP_MODE;


// ===========================================
//  스토리지 스펙 정의
// ===========================================
const persistConfig = {
    key: `flownet-store-${APP_MODE}`,
    storage: storage,
    whitelist: [
        'session',
    ],
};

// function createPersistConfig(name: string) {
//     return {
//         key: `flownet-${name}-${APP_MODE}`,
//         storage: storage,
//     };
// }

// ===========================================
//  전역 루트 리듀서 결합 (Root Reducer Pipeline)
// ===========================================
const globalReducer = combineReducers({
    login: loginReducer,
    session: sessionReducer,
    // settingNotification: persistReducer(createPersistConfig('setting-notification'), settingNotificationReducer),
});


const persistedReducer = persistReducer(persistConfig, globalReducer);

// ===========================================
//  Redux Thunk 전용 로깅 미들웨어 
// ===========================================
const rtkLoggingMiddleware: Middleware = () => (next) => (action: any) => {
    const type = action.type;

    // Thunk 라이프사이클 액션만 필터링하여 로깅
    if (typeof type === 'string') {

        const getMaskedData = (data: any) => {
            if (!data || typeof data !== 'object') return data || '';
            const cloned = { ...data }; // 원본 객체 손상 방지
            
            if (cloned.password) cloned.password = '***';
            
            return cloned;
        };

        if (type.endsWith('/pending')) {
            // API 호출 시작 (파라미터 포함)
            const safeArg = getMaskedData(action.meta?.arg);
            customLogger.info(`[REDUX][PENDING] ${type}`, safeArg);
        } else if (type.endsWith('/fulfilled')) {
            // API 호출 성공
            customLogger.info(`[REDUX][SUCCESS] ${type}`);
        } else if (type.endsWith('/rejected')) {

            const payload = action.payload;
            const errorCode = payload?.code || action.error?.code;

            if (EXPECTED_ERROR_CODES.includes(errorCode)) {
                customLogger.warn(`[REDUX][BIZ_FAIL] ${type}`, payload);
            } else {
                customLogger.error(`[REDUX][FAIL] ${type}`, payload || action.error);
            }
        }
    }

    // 다음 미들웨어(또는 리듀서)로 액션 전달
    return next(action);
};



// ===========================================
//  글로벌 앱 스토어 인스턴스 코어 빌드
// ===========================================
const appStore = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
            },
        }).concat(rtkLoggingMiddleware),
    devTools: APP_MODE === 'dev',
});


// ===========================================
//  TypeScript 전역 타입 익스포트 파트
// ===========================================
export type RootState = ReturnType<typeof appStore.getState>
export type AppDispatch = typeof appStore.dispatch;
export type TypedDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
export type TypedThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export default appStore;
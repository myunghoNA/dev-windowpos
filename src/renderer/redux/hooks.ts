import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { RootState, TypedDispatch } from '@renderer/redux/store';

/**
 * @name useAppDispatch
 * @description 미들웨어(Thunk 등)가 결합된 렌더러 전역 스토어 전용 디스패처 훅
 * @example
 *          const dispatch = useAppDispatch();
 *          dispatch(OpenLayer({ title: '알림', layerType: 'ALERT' }));
 */
export const useAppDispatch= () => useDispatch<TypedDispatch>();

/**
 * @name useAppSelector
 * @description 전역 상태(RootState)의 데이터 구조와 타입을 자동완성 지원하는 셀렉터 훅
 * @example
 *        const { isOpen, title } = useAppSelector(selectLayer);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
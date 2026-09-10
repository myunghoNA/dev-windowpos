import { createSlice } from '@reduxjs/toolkit';

// ===========================================
//  전역 모달 레이어 상태 인터페이스 명세
// ===========================================
interface LayerPros {
    title: string
    children: string,
    data: any,
    event: string,
    closeEvent: any,
    isOpen: boolean,
    optionType?: string
}

const initialState: LayerPros = {
    title: '',
    children: '',
    data: '',
    event: '',
    closeEvent: '',
    isOpen: false,
    optionType: '',
};

// ===========================================
//  레이어 전역 슬라이스 및 리듀서 파이프라인
// ===========================================
export const LayerSlice = createSlice({
    name: 'layer',
    initialState,
    reducers: {
        /**
         * @name OpenLayer
         * @description 화면 전역 어디서든 팝업을 파라미터와 함께 동적으로 기동
         */
        OpenLayer: (state, action) => {
            state.title = action.payload.title;
            state.children = action.payload.children;
            state.data = action.payload.data;
            state.event = action.payload.event;
            state.closeEvent = action.payload.closeEvent;
            state.optionType = action.payload.optionType ? action.payload.optionType : '';
            state.isOpen = true;
        },
        /**
         * @name CloseLayer
         * @description 가동 중인 팝업을 닫고 전역 메모리 버퍼를 초기 상태로 리셋
         */
        CloseLayer: (state) => {
            state = initialState;
            return state;
        },
    },
});

// ===========================================
//  액션 크리에이터 및 셀렉터(Selector) 포워딩
// ===========================================
export const { OpenLayer, CloseLayer } = LayerSlice.actions;

/**
 * @name selectLayer
 * @description 컴포넌트 뷰포트단에서 레이어 상태를 구독
 */
export const selectLayer = (state) => state.layer;

export default LayerSlice.reducer;
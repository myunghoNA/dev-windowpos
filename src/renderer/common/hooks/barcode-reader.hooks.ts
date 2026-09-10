import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// ===========================================
//  바코드 리더 전역 하드웨어 키 필터 정의
// ===========================================
const FLUSH_KEYS    = ['Enter']; 
const EXCLUDED_KEYS = [
  'Backspace', 'Tab', 'Shift', 'Control', 'Alt', 'Pause', 'CapsLock','Escape',
  'PageUp', 'PageDown', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp','ArrowDown',
  'Insert', 'Delete', 'Meta', 'HanjaMode', 'ContextMenu', 'NumLock', 'ArrowUp','ArrowDown',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7','F8','F9','F10','F11','F12',
]; 

interface BarcodeState {
  BarCode: string;
}

/**
 * @name useBarcodeReader
 * @description 바코드 스캐너의 바코드 데이터리더
 */
export const useBarcodeReader = (): BarcodeState => { 

  const initInputValue: BarcodeState = { BarCode: '' };

  // 화면 리렌더링 유발 상태
  const [inputValue, setInputValue] = useState<BarcodeState>(initInputValue); 

  // 리렌더링을 유발방지
  const bufferRef = useRef<string>('');

  // ===========================================
  //   마지막 타이핑 감지용 세팅
  // ===========================================
  const debouncedClearBuffer = useDebouncedCallback(() => {
    bufferRef.current = '';
  }, 300); 


  /**
  * @name handleKeyDown
  * @description 키보드 인터셉트 및 문자열 조립
  */
  const handleKeyDown = useCallback((event: KeyboardEvent) => { 

    // 엔터키(종료 신호) 수신 시 
    if (FLUSH_KEYS.includes(event.key)) { 
      const finalBarcode = bufferRef.current.trim();
      
      if (finalBarcode.length > 0) {
        setInputValue({ BarCode: finalBarcode });
        bufferRef.current = ''; 
      }
      return; 
    }

    // 제어 문자 필터링
    if (EXCLUDED_KEYS.includes(event.key)) { 
      return; 
    } 

    // 순수 문자열 버퍼 축적
    bufferRef.current += event.key;
    
    // 키보드 오입력 자동 클리어 대기
    debouncedClearBuffer();

  }, [debouncedClearBuffer]);


  // ===========================================
  //  글로벌 윈도우 키 이벤트 바인딩
  // ===========================================
  useEffect(() => { 
    window.addEventListener('keydown', handleKeyDown); 
    
    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      debouncedClearBuffer.cancel(); 
    }; 
  }, [handleKeyDown, debouncedClearBuffer]); 


  return inputValue; 
};
import { useState } from 'react';


// 필드가 3개 이상이면 객체 반환
export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset: () => setCount(initial),
    setValue: setCount,
  };
}
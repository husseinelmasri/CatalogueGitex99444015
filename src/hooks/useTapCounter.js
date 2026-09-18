import { useRef } from 'react';

export function useTapCounter(onComplete, target = 10, windowMs = 2000) {
  const taps = useRef([]);

  const tap = () => {
    const now = Date.now();
    // Keep only taps within the last windowMs
    taps.current = taps.current.filter((t) => now - t < windowMs);
    taps.current.push(now);

    if (taps.current.length >= target) {
      taps.current = [];
      onComplete();
    }
  };

  return tap;
}

import { useEffect, useRef } from 'react';
export default function useRAF(callback: (dt: number) => void, active = true) {
  const last = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const tick = (t: number) => {
      if (last.current == null) last.current = t;
      const dt = (t - last.current) / 1000; // seconds
      last.current = t;
      callback(dt);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      last.current = null;
    };
  }, [active]);
}
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

/**
 * Tick-up (slot-machine) animated number.
 * Animates from previous value to new value over `duration` ms.
 */
const AnimatedNumber = ({
  value,
  decimals = 2,
  duration = 600,
  suffix = "",
  prefix = "",
}: AnimatedNumberProps) => {
  const [display, setDisplay] = useState<number>(value);
  const fromRef = useRef<number>(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isFinite(value)) {
      setDisplay(value);
      return;
    }
    fromRef.current = isFinite(display) ? display : value;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  if (!isFinite(value)) return <span>N/A</span>;
  return (
    <span className="tabular-nums">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;

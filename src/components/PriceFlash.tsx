import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface PriceFlashProps {
  value: string | number;
  className?: string;
  children?: React.ReactNode;
}

const PriceFlash = ({ value, className, children }: PriceFlashProps) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevValueRef = useRef<string | number>(value);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    const currentValue = value;

    if (prevValue !== currentValue) {
      const prev = typeof prevValue === 'string' ? parseFloat(prevValue) : prevValue;
      const curr = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;

      if (curr > prev) {
        setFlash('up');
      } else if (curr < prev) {
        setFlash('down');
      }

      prevValueRef.current = currentValue;

      const timer = setTimeout(() => {
        setFlash(null);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={cn(
        "transition-all duration-300",
        flash === 'up' && "animate-flash-green",
        flash === 'down' && "animate-flash-red",
        className
      )}
    >
      {children || value}
    </span>
  );
};

export default PriceFlash;

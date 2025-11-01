import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCountdown, formatCountdownVerbose } from '@/lib/formatters';
import { TICK_SECONDS } from '@/lib/constants';

interface CountdownTimerProps {
  targetTick: number;
  currentTick: number;
  tickSeconds?: number;
  format?: 'full' | 'compact' | 'minimal';
  onExpire?: () => void;
  className?: string;
}

const CountdownTimer = ({
  targetTick,
  currentTick,
  tickSeconds = TICK_SECONDS,
  format = 'compact',
  onExpire,
  className,
}: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(
    (targetTick - currentTick) * tickSeconds
  );

  useEffect(() => {
    setTimeRemaining((targetTick - currentTick) * tickSeconds);
  }, [targetTick, currentTick, tickSeconds]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, onExpire]);

  if (timeRemaining < 0) {
    return (
      <span className={cn('text-muted-foreground', className)}>
        Awaiting Resolution
      </span>
    );
  }

  const displayText =
    format === 'minimal'
      ? formatCountdown(timeRemaining)
      : formatCountdownVerbose(timeRemaining);

  const isUrgent = timeRemaining < 60;
  const isCritical = timeRemaining < 30;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 font-mono',
        isUrgent && 'text-danger',
        isCritical && 'animate-pulse-scale',
        className
      )}
    >
      <Clock className="w-4 h-4" />
      <span className="font-semibold">{displayText}</span>
    </div>
  );
};

export default CountdownTimer;

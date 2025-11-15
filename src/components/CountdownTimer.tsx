import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCountdown, formatCountdownVerbose } from '@/lib/formatters';

interface CountdownTimerProps {
  // 支持两种模式：基于 tick 或基于时间戳
  targetTick?: number;
  currentTick?: number;
  tickSeconds?: number;
  // 或者直接使用时间戳（推荐）
  targetTimestamp?: number; // Unix timestamp in seconds
  format?: 'full' | 'compact' | 'minimal';
  onExpire?: () => void;
  className?: string;
}

const CountdownTimer = ({
  targetTick,
  currentTick,
  tickSeconds = 5,
  targetTimestamp,
  format = 'compact',
  onExpire,
  className,
}: CountdownTimerProps) => {
  const { t } = useTranslation('market');
  // 计算初始剩余时间
  const calculateInitialTime = (): number => {
    if (targetTimestamp) {
      // 使用时间戳模式
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, targetTimestamp - now);
    } else if (targetTick !== undefined && currentTick !== undefined) {
      // 使用 tick 模式
      return Math.max(0, (targetTick - currentTick) * tickSeconds);
    }
    return 0;
  };

  const [timeRemaining, setTimeRemaining] = useState<number>(calculateInitialTime);

  // 当 targetTimestamp 或 ticks 变化时重新计算
  useEffect(() => {
    setTimeRemaining(calculateInitialTime());
  }, [targetTimestamp, targetTick, currentTick, tickSeconds]);

  // 倒计时逻辑
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
        {t('awaitingResolution')}
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

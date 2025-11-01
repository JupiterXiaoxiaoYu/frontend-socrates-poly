import { cn } from "@/lib/utils";
import { MarketStatus } from "../types/api";

interface StatusBadgeProps {
  status: MarketStatus | 'pending' | 'active' | 'closed' | 'resolved';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({ status, size = 'sm' }: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'h-5 px-2 text-[10px]',
    md: 'h-6 px-3 text-xs',
    lg: 'h-7 px-4 text-sm',
  };

  // 处理数字类型的 MarketStatus
  const normalizedStatus = typeof status === 'number' 
    ? (['pending', 'active', 'resolved', 'closed'][status] as 'pending' | 'active' | 'resolved' | 'closed')
    : status;

  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-muted text-muted-foreground',
    },
    active: {
      label: 'Live',
      className: 'bg-success/20 text-success-light border border-success/30 animate-pulse-scale',
    },
    closed: {
      label: 'Closed',
      className: 'bg-warning/20 text-warning border border-warning/30',
    },
    resolved: {
      label: 'Settled',
      className: 'bg-primary/20 text-primary border border-primary/30',
    },
  };

  const config = statusConfig[normalizedStatus] || statusConfig.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        sizeClasses[size],
        config.className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;

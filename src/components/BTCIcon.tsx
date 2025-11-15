import { Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";

interface BTCIconProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const BTCIcon = ({ size = "md", className }: BTCIconProps) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  };

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0",
        sizeClasses[size],
        className
      )}
    >
      <Bitcoin className={cn("text-white", iconSizeClasses[size])} />
    </div>
  );
};

export default BTCIcon;


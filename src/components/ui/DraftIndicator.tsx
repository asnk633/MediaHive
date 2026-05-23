import React from 'react';
import { cn } from '@/lib/utils';
import { CloudOff, Cloud, Check } from 'lucide-react';

interface DraftIndicatorProps {
  isSaved: boolean;
  className?: string;
}

export function DraftIndicator({ isSaved, className }: DraftIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-medium tracking-wide transition-opacity duration-500",
        isSaved ? "opacity-100 text-emerald-500" : "opacity-0 text-foreground/80",
        className
      )}
    >
      {isSaved ? <Check className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
      <span>{isSaved ? "Draft saved" : "Saving..."}</span>
    </div>
  );
}

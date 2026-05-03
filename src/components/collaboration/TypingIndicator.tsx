import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TypingIndicatorProps {
  fieldName: string;
  userContext?: { name: string; isTyping: boolean };
}

export function TypingIndicator({ fieldName, userContext }: TypingIndicatorProps) {
  if (!userContext || !userContext.isTyping) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-medium tracking-wide animate-in fade-in slide-in-from-left-2 duration-300">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>{userContext.name} is typing...</span>
    </div>
  );
}

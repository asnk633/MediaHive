import React from 'react';
import { PresenceUser } from '@/lib/collaboration/collabManager';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PresencePileProps {
  users: PresenceUser[];
  maxUsers?: number;
}

export function PresencePile({ users, maxUsers = 4 }: PresencePileProps) {
  const uniqueUsers = React.useMemo(() => {
    const map = new Map();
    (users || []).forEach(u => {
      if (u.id && !map.has(u.id)) map.set(u.id, u);
    });
    return Array.from(map.values());
  }, [users]);

  const displayUsers = uniqueUsers.slice(0, maxUsers);
  const remaining = uniqueUsers.length - maxUsers;

  if (uniqueUsers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      <TooltipProvider delayDuration={100}>
        {displayUsers.map((user, index) => {
          const initials = user.name
            ? user.name.substring(0, 2).toUpperCase()
            : 'U';
          
          return (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#10111a] bg-blue-600 text-[10px] font-bold text-foreground shadow-sm ring-2 ring-transparent transition-all hover:z-10 hover:ring-blue-400"
                  style={{ zIndex: displayUsers.length - index }}
                >
                  {initials}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#10111a] border border-[#ffffff1a] text-foreground">
                <p className="text-xs">{user.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {remaining > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#10111a] bg-foreground/10 text-[10px] font-bold text-foreground/70 shadow-sm"
                style={{ zIndex: 0 }}
              >
                +{remaining}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#10111a] border border-[#ffffff1a] text-foreground">
              <p className="text-xs">{remaining} more users viewing</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

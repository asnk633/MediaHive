import React, { useEffect, useState, useCallback } from 'react';
import { collabManager, PresenceUser } from './collabManager';
import { useAuth } from '@/hooks/useAuth'; // Assuming this exists
import { toast } from 'sonner';

export function useCollaboration(entityType: string, entityId: string) {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [editingUsers, setEditingUsers] = useState<Record<string, { name: string; isTyping: boolean }>>({});
  const [lastUpdated, setLastUpdated] = useState<Record<string, { name: string; time: number }>>({});
  
  // Step 2: Typing Protection
  const typingRef = React.useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!user || !entityId) return;

    collabManager.init({ id: user.id, name: user.name || user.email || 'Unknown' });
    collabManager.joinEntity(entityType, entityId);

    const unsubscribe = collabManager.subscribe(entityType, entityId, (users) => {
      setActiveUsers(users);
      
      const editingMap: Record<string, { name: string; isTyping: boolean }> = {};
      users.forEach(u => {
        if (u.id !== user.id && u.editingField) {
          editingMap[u.editingField] = { name: u.name, isTyping: !!u.isTyping };
        }
      });
      setEditingUsers(editingMap);
    });

    return () => {
      unsubscribe();
      collabManager.leaveEntity(entityType, entityId);
    };
  }, [user, entityType, entityId]);

  const onFieldFocus = useCallback((field: string) => {
    collabManager.broadcastFocus(entityType, entityId, field, !!typingRef.current[field]);
  }, [entityType, entityId]);

  const onFieldBlur = useCallback((field: string) => {
    typingRef.current[field] = false;
    collabManager.broadcastFocus(entityType, entityId, field, false);
  }, [entityType, entityId]);

  const onTyping = useCallback((field: string, isTyping: boolean) => {
    typingRef.current[field] = isTyping;
    collabManager.broadcastFocus(entityType, entityId, field, isTyping);
  }, [entityType, entityId]);

  const onFieldChange = useCallback((fields: Record<string, any>) => {
    collabManager.broadcastUpdate(entityType, entityId, fields);
  }, [entityType, entityId]);

  return {
    activeUsers,
    editingUsers,
    onFieldFocus,
    onFieldBlur,
    onFieldChange,
    onTyping
  };
}

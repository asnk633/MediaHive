// src/hooks/useNotifications.ts
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/client';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export function useNotifications(uid?: string) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'notifications'), where('to', '==', uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);
  return items;
}
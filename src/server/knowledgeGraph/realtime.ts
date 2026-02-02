// src/server/knowledgeGraph/realtime.ts
// Real-time updates for knowledge graph

import { subscribeToEvents } from '@/app/api/_lib/realtime';
import { knowledgeGraph } from './index';
import { updateKnowledgeGraph } from './background';

// Subscribe to task events
subscribeToEvents('task.created', async (data) => {
  console.log('Task created, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

subscribeToEvents('task.updated', async (data) => {
  console.log('Task updated, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

subscribeToEvents('task.deleted', async (data) => {
  console.log('Task deleted, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

// Subscribe to user events
subscribeToEvents('user.created', async (data) => {
  console.log('User created, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

subscribeToEvents('user.updated', async (data) => {
  console.log('User updated, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

// Subscribe to event events
subscribeToEvents('event.created', async (data) => {
  console.log('Event created, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

subscribeToEvents('event.updated', async (data) => {
  console.log('Event updated, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

// Subscribe to institution events
subscribeToEvents('institution.created', async (data) => {
  console.log('Institution created, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

// Subscribe to file events
subscribeToEvents('file.uploaded', async (data) => {
  console.log('File uploaded, updating knowledge graph:', data);
  await updateKnowledgeGraph();
});

console.log('Knowledge graph realtime updates initialized');
// src/server/init.ts
// Server initialization file

import { startKnowledgeGraphBackgroundJob } from './knowledgeGraph/background';
import './knowledgeGraph/realtime';
import { startNotificationProcessor } from './notifications/processor';

// Initialize server components
export async function initializeServer() {
  console.log('Initializing server components...');
  
  // Start knowledge graph background job
  await startKnowledgeGraphBackgroundJob();
  
  // Start notification processor
  startNotificationProcessor();
  
  console.log('Server initialization complete');
}

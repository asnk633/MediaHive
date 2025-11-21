// src/server/knowledgeGraph/background.ts
// Background job to periodically update the knowledge graph

import { populateKnowledgeGraph } from './populate';

// Background job to update knowledge graph periodically
export async function startKnowledgeGraphBackgroundJob() {
  console.log('Starting knowledge graph background job...');
  
  // Initial population
  await populateKnowledgeGraph();
  
  // Update every 10 minutes
  setInterval(async () => {
    console.log('Updating knowledge graph...');
    await populateKnowledgeGraph();
  }, 10 * 60 * 1000); // 10 minutes
}

// Immediate update function
export async function updateKnowledgeGraph() {
  await populateKnowledgeGraph();
}
// src/server/knowledgeGraph/populate.ts
// Script to populate knowledge graph with data from database

import { db } from '@/db';
import { institutions, users, tasks, events, files } from '@/db/schema';
import { knowledgeGraph } from './index';
import { eq } from 'drizzle-orm';

export async function populateKnowledgeGraph() {
  console.log('Populating knowledge graph...');
  
  // Clear existing graph
  knowledgeGraph.clear();
  
  try {
    // Populate institutions
    const institutionRecords = await db.select().from(institutions);
    for (const institution of institutionRecords) {
      knowledgeGraph.addNode({
        id: `institution-${institution.id}`,
        type: 'institution',
        name: institution.name,
        properties: {
          id: institution.id,
          name: institution.name,
          created_at: institution.created_at,
        },
        relationships: []
      });
    }
    
    // Populate users
    const userRecords = await db.select().from(users);
    for (const user of userRecords) {
      knowledgeGraph.addNode({
        id: `user-${user.id}`,
        type: 'user',
        name: user.fullName,
        properties: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          institution_id: user.institution_id,
          created_at: user.created_at,
        },
        relationships: []
      });
    }
    
    // Populate tasks
    const taskRecords = await db.select().from(tasks);
    for (const task of taskRecords) {
      knowledgeGraph.addNode({
        id: `task-${task.id}`,
        type: 'task',
        name: task.title,
        properties: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedToId: task.assignedToId,
          createdById: task.createdById,
          institution_id: task.institution_id,
          due_date: task.due_date,
          created_at: task.created_at,
        },
        relationships: []
      });
    }
    
    // Populate events
    const eventRecords = await db.select().from(events);
    for (const event of eventRecords) {
      knowledgeGraph.addNode({
        id: `event-${event.id}`,
        type: 'event',
        name: event.title,
        properties: {
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          approval_status: event.approval_status,
          createdById: event.createdById,
          institution_id: event.institution_id,
          created_at: event.created_at,
        },
        relationships: []
      });
    }
    
    // Populate assets/files
    const fileRecords = await db.select().from(files);
    for (const file of fileRecords) {
      knowledgeGraph.addNode({
        id: `asset-${file.id}`,
        type: 'asset',
        name: file.name,
        properties: {
          id: file.id,
          name: file.name,
          fileUrl: file.fileUrl,
          fileType: file.fileType,
          fileSize: file.fileSize,
          folder: file.folder,
          visibility: file.visibility,
          uploadedById: file.uploadedById,
          institution_id: file.institution_id,
          created_at: file.created_at,
        },
        relationships: []
      });
    }
    
    // Build automatic relationships
    knowledgeGraph.buildAutomaticRelationships();
    
    console.log('Knowledge graph populated successfully:', knowledgeGraph.getStats());
  } catch (error) {
    console.error('Failed to populate knowledge graph:', error);
  }
}

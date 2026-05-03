// Test file to verify the fix for IDBKeyRange issue
// This is a simple test to verify that our fix works correctly

import { openDB, addConflict, getUnresolvedConflicts } from './offline-db';

async function testFix() {
  try {
    // Add a test conflict
    await addConflict(1, {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    }, {
      id: 1,
      title: 'Server Version',
      status: 'completed'
    });
    
    // Get unresolved conflicts
    const conflicts = await getUnresolvedConflicts();
    console.log('Unresolved conflicts:', conflicts);
    
    console.log('Test passed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testFix();

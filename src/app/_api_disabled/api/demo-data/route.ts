import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { isFeatureEnabled } from '@/app/featureFlags';


/**
 * POST /api/demo-data
 * Generate or delete demo data for the workspace
 * Body: { action: 'generate' | 'delete' }
 */
export async function POST(req: NextRequest) {
  try {
    // Check if onboarding layer feature is enabled
    if (!isFeatureEnabled('onboardingLayer')) {
      return NextResponse.json({ error: 'Onboarding layer feature is disabled' }, { status: 403 });
    }

    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage demo data
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage demo data' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !['generate', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be one of: generate, delete' }, { status: 400 });
    }

    // Get institutionId from user or default to '1'
    const institutionId = user.institutionId || '1';

    if (action === 'generate') {
      const result = await generateDemoData(user.uid, institutionId);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } else if (action === 'delete') {
      const result = await deleteDemoData(institutionId);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }
  } catch (error) {
    console.error('[POST /api/demo-data]', error);
    return NextResponse.json(
      { error: 'Failed to manage demo data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generateDemoData(userId: string, institutionId: string) {
  try {
    const { firestore } = await getFirebaseServices();

    // Create demo events
    const events = [
      {
        id: `demo_event_${Date.now()}_1`,
        title: 'Annual Company Retreat',
        description: 'Planning and execution of our annual company retreat at the mountain resort',
        status: 'active',
        startDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
        endDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
        createdAt: new Date(),
        createdBy: userId,
        isDemoData: true,
        institutionId
      },
      {
        id: `demo_event_${Date.now()}_2`,
        title: 'Product Launch Campaign',
        description: 'Marketing campaign for the new product launch in Q1',
        status: 'planning',
        startDate: new Date(Date.now() - 86400000 * 10), // 10 days ago
        endDate: new Date(Date.now() + 86400000 * 14), // 14 days from now
        createdAt: new Date(),
        createdBy: userId,
        isDemoData: true,
        institutionId
      },
      {
        id: `demo_event_${Date.now()}_3`,
        title: 'Team Building Workshop',
        description: 'Quarterly team building workshop to improve collaboration',
        status: 'completed',
        startDate: new Date(Date.now() - 86400000 * 20), // 20 days ago
        endDate: new Date(Date.now() - 86400000 * 18), // 18 days ago
        createdAt: new Date(),
        createdBy: userId,
        isDemoData: true,
        institutionId
      }
    ];

    // Add events to Firestore
    for (const event of events) {
      await firestore.collection('events').doc(event.id).set(event);
    }

    // Create demo tasks
    const statuses: string[] = ['todo', 'in_progress', 'review', 'done', 'pending'];
    const priorities: string[] = ['low', 'medium', 'high'];

    const tasks = [];
    for (let i = 0; i < 8; i++) {
      const task: any = {
        id: `demo_task_${Date.now()}_${i}`,
        title: `Demo Task ${i + 1}: ${[
          'Prepare presentation',
          'Review marketing materials',
          'Update documentation',
          'Test new features',
          'Plan event logistics',
          'Coordinate with vendors',
          'Finalize budget',
          'Schedule team meeting'
        ][i]}`,
        description: `This is a demo task to showcase the functionality of the Thaiba Garden Media Manager. Task ${i + 1} demonstrates various workflow capabilities.`,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        dueDate: new Date(Date.now() + 86400000 * (i + 3)), // Due in 3-10 days
        createdAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 10)), // Created 0-10 days ago
        createdBy: userId,
        assignedTo: i % 3 === 0 ? [] : [{ uid: userId, name: 'Demo User' }], // Some unassigned
        department: ['Marketing', 'Operations', 'Development', 'HR'][i % 4],
        isDemoData: true,
        institutionId,
        updatedAt: new Date(),
        updatedBy: { uid: userId, role: 'admin' },
        mediaUploaded: i % 2 === 0, // Some tasks have media
        mediaApproved: i % 3 === 0, // Some tasks have approved media
        mediaApprovedDate: i % 3 === 0 ? new Date(Date.now() - 86400000 * 2) : null, // Approved 2 days ago if approved
      };
      tasks.push(task);
    }

    // Add tasks to Firestore
    for (const task of tasks) {
      await firestore.collection('tasks').doc(task.id).set(task);
    }

    // Create demo media files with versions and proofing states
    const mediaFiles = [];
    for (let i = 0; i < 12; i++) {
      const mediaFile: any = {
        id: `demo_media_${Date.now()}_${i}`,
        name: `demo_media_${i + 1}.${['jpg', 'png', 'mp4', 'pdf'][i % 4]}`,
        mimeType: ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'][i % 4],
        size: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB - 1.1MB
        downloadLink: '#',
        thumbnailUrl: '#',
        uploadedBy: userId,
        uploadedByName: 'Demo User',
        createdAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 10)), // Uploaded 0-10 days ago
        updatedAt: new Date(),
        institutionId,
        isDemoData: true,
        versionNumber: 1,
        isActiveVersion: true,
        versionGroupId: `demo_version_group_${Math.floor(i / 3)}`, // Group every 3 files as versions
        proofingStatus: ['pending', 'approved', 'changes_requested'][i % 3],
        proofingApprovedBy: i % 3 === 1 ? userId : null, // Approved if status is approved
        proofingApprovedAt: i % 3 === 1 ? new Date(Date.now() - 86400000 * 1) : null, // Approved yesterday if approved
        taskId: tasks[i % tasks.length].id, // Link to tasks
        eventId: events[i % events.length].id, // Link to events
      };
      mediaFiles.push(mediaFile);
    }

    // Add media files to Firestore
    for (const file of mediaFiles) {
      await firestore.collection('files').doc(file.id).set(file);
    }

    // Create some additional versions for versioning demo
    for (let i = 0; i < 4; i++) {
      const versionFile: any = {
        id: `demo_media_version_${Date.now()}_${i}`,
        name: `demo_media_${i + 1}_v2.${['jpg', 'png', 'mp4', 'pdf'][i % 4]}`,
        mimeType: ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'][i % 4],
        size: Math.floor(Math.random() * 1000000) + 100000,
        downloadLink: '#',
        thumbnailUrl: '#',
        uploadedBy: userId,
        uploadedByName: 'Demo User',
        createdAt: new Date(Date.now() - 86400000 * 2), // Uploaded 2 days ago
        updatedAt: new Date(),
        institutionId,
        isDemoData: true,
        versionNumber: 2, // Version 2
        isActiveVersion: false, // Not active
        versionGroupId: `demo_version_group_${i}`, // Same group as original
        proofingStatus: ['pending', 'approved', 'changes_requested'][i % 3],
        proofingApprovedBy: i % 3 === 1 ? userId : null,
        proofingApprovedAt: i % 3 === 1 ? new Date(Date.now() - 86400000 * 1) : null,
        taskId: tasks[i % tasks.length].id,
        eventId: events[i % events.length].id,

      };
      await firestore.collection('files').doc(versionFile.id).set(versionFile);
    }

    return {
      success: true,
      message: `Successfully created ${events.length} events, ${tasks.length} tasks, and ${mediaFiles.length + 4} media files`,
      data: {
        eventsCreated: events.length,
        tasksCreated: tasks.length,
        mediaCreated: mediaFiles.length + 4
      }
    };
  } catch (error) {
    console.error('Error generating demo data:', error);
    return {
      success: false,
      message: `Failed to generate demo data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function deleteDemoData(institutionId: string) {
  try {
    const { firestore } = await getFirebaseServices();

    // Get all demo data documents
    const eventsSnapshot = await firestore
      .collection('events')
      .where('isDemoData', '==', true)
      .where('institutionId', '==', institutionId)
      .get();

    const tasksSnapshot = await firestore
      .collection('tasks')
      .where('isDemoData', '==', true)
      .where('institutionId', '==', institutionId)
      .get();

    const filesSnapshot = await firestore
      .collection('files')
      .where('isDemoData', '==', true)
      .where('institutionId', '==', institutionId)
      .get();

    // Delete all demo events
    const eventBatch = firestore.batch();
    eventsSnapshot.forEach((doc: any) => {
      eventBatch.delete(doc.ref);
    });
    await eventBatch.commit();

    // Delete all demo tasks
    const taskBatch = firestore.batch();
    tasksSnapshot.forEach((doc: any) => {
      taskBatch.delete(doc.ref);
    });
    await taskBatch.commit();

    // Delete all demo files
    const fileBatch = firestore.batch();
    filesSnapshot.forEach((doc: any) => {
      fileBatch.delete(doc.ref);
    });
    await fileBatch.commit();

    return {
      success: true,
      message: `Successfully deleted ${eventsSnapshot.size} events, ${tasksSnapshot.size} tasks, and ${filesSnapshot.size} media files`
    };
  } catch (error) {
    console.error('Error deleting demo data:', error);
    return {
      success: false,
      message: `Failed to delete demo data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * GET /api/demo-data
 * Check if demo data exists for the current institution
 */
export async function GET(req: NextRequest) {
  try {
    // Check if onboarding layer feature is enabled
    if (!isFeatureEnabled('onboardingLayer')) {
      return NextResponse.json({ error: 'Onboarding layer feature is disabled' }, { status: 403 });
    }

    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get institutionId from user or default to '1'
    const institutionId = user.institutionId || '1';

    // Check if demo data exists
    const eventsSnapshot = await firestore
      .collection('events')
      .where('isDemoData', '==', true)
      .where('institutionId', '==', institutionId)
      .limit(1)
      .get();

    const tasksSnapshot = await firestore
      .collection('tasks')
      .where('isDemoData', '==', true)
      .where('institutionId', '==', institutionId)
      .limit(1)
      .get();

    const filesSnapshot = await firestore
      .collection('files')
      .where('isDemoData', '==', true)
      .where('institutionId', '==', institutionId)
      .limit(1)
      .get();

    const hasDemoData =
      !eventsSnapshot.empty ||
      !tasksSnapshot.empty ||
      !filesSnapshot.empty;

    return NextResponse.json({
      hasDemoData,
      demoDataCounts: {
        events: eventsSnapshot.size > 0 ? 'exists' : 'none',
        tasks: tasksSnapshot.size > 0 ? 'exists' : 'none',
        files: filesSnapshot.size > 0 ? 'exists' : 'none'
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/demo-data]', error);
    return NextResponse.json(
      { error: 'Failed to check demo data status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

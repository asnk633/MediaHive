import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server'; // Using existing admin init
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { ServerNotification } from '@/lib/server-notification';
import { verifyUser } from '@/lib/server-utils';

// export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content } = await req.json();
        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }

        const params = await props.params;
        const taskId = params.id;
        const db = adminDb;
        const taskRef = db.collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const taskData = taskDoc.data();

        // 1. Save Comment to Activity
        const newActivity = {
            id: Date.now().toString(),
            type: 'comment',
            userId: user.uid,
            userName: user.role || 'User', // Ideally we fetch real name, but role/uid generic backup
            content: content,
            timestamp: Timestamp.now()
        };

        // We need to fetch the user's name for the activity log proper display
        // Optimization: verifyingUser usually returns minimal info. We might assume client sends name or we fetch profile.
        // Let's check 'users' collection for name.
        const userProfile = await db.collection('users').doc(user.uid).get();
        if (userProfile.exists) {
            newActivity.userName = userProfile.data()?.name || user.role;
        }

        // Update Task Activity
        // Note: Using arrayUnion is safer for concurrent edits
        await taskRef.update({
            activity: FieldValue.arrayUnion(newActivity) as any,
            updatedAt: Timestamp.now()
        });

        // 2. Process Notifications

        // A. Mentions
        // Regex to find @Mention 
        // Assumption: Mentions are strictly @Name or we blindly check @word. 
        // Robust way: Client sends list of mentioned IDs, OR we parse text and lookup users.
        // For Phase 2A MVP: We'll assume the client MIGHT send mentioned IDs or we rely on simple regex against known user names? 
        // Let's rely on a simpler approach: Matches @Username and looks up 'name' in participants?
        // Actually, widespread practice: Text analysis is partial. 
        // BETTER APPROACH: Client parses mentions and sends `mentionedUserIds` in the payload?
        // Failing that, backend does regex.
        // Let's implement Regex for @[Name] or @Name.
        // And match against tasks's interested parties (assigned, creator) or all users?
        // "All users" is expensive. Let's start with Notify assigned + creator.

        // Identifying targets
        const creatorId = taskData?.createdBy?.uid;
        const assignedIds = (taskData?.assignedTo || []).map((u: any) => u.uid || u);
        const collaborators = new Set<string>([creatorId, ...assignedIds].filter(Boolean));

        // Remove self
        collaborators.delete(user.uid);

        const mentionedIds = new Set<string>();

        // Check for @mentions in content against collaborators names?
        // Or did we want a specific separate notification for mentions?
        // For this pass, we will notify all collaborators as 'comment_added' 
        // UNLESS we passed explicit mentions logic.
        // Since we don't have a robust "@User" lookup system in place yet, we'll strip 'mention' logic to just checking if content contains "@".
        // Wait, requirement is "Trigger: User mentioned via @username".
        // I'll scan the text.

        // Fetch collaborator profiles to match names
        // This is getting heavy for a single API call.
        // Alternative: Just broadcast comment_added to everyone for now, and rely on client to highlight.
        // BUT User specifically asked for Mention Notification = High Priority.

        // Compromise for MVP Logic:
        // If the comment has "@", we flag it. 
        // To do it right without client support: We'd need to fetch all users and match names.
        // Let's try to match against the Task's Assigned Users names since that's contextually most likely.

        const assignedUsers = taskData?.assignedTo || [];
        const mentionedInTextIds: string[] = [];

        assignedUsers.forEach((u: any) => {
            // Simple case-insensitive match
            if (content.toLowerCase().includes(`@${u.name.toLowerCase()}`)) {
                mentionedInTextIds.push(u.uid);
                mentionedIds.add(u.uid);
            }
        });

        // Notify Mentions (High Priority)
        for (const mentionedUid of mentionedInTextIds) {
            // Remove from generic collaborators list so they don't get double notified?
            // Or getting both is fine? usually one is better.
            collaborators.delete(mentionedUid);

            await ServerNotification.notifyMentioned(
                'task',
                taskId,
                taskData?.title || 'Task',
                user.uid,
                mentionedUid
            );
        }

        // Notify Others (Standard "Comment Added")
        if (collaborators.size > 0) {
            await ServerNotification.notifyCommentAdded(
                'task',
                taskId,
                taskData?.title || 'Task',
                user.uid,
                content,
                Array.from(collaborators)
            );
        }

        return NextResponse.json({ success: true, activity: newActivity });

    } catch (error) {
        console.error('Error adding comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

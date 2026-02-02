import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, ensureFolderPath, sanitizeForDrive } from "@/lib/drive";
import { ensureTaskFolder } from "@/lib/drive-init";
import { adminDb } from "@/lib/firebase/server";
import { FieldValue } from "firebase-admin/firestore";
import { Readable } from "stream";
import { logSystemActivity } from "@/lib/server/activity-logger";

const db = adminDb;


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        // --- JSON MODE (Metadata Only - Called by DeliverableService) ---
        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { taskId, driveFileId, fileName, fileType, fileSize, downloadUrl, version, supersedes, uploadedBy } = body;

            // Extract user details from nested object (Service sends this) or top-level (Process fallback)
            const uid = uploadedBy?.uid || body.uid;
            const name = uploadedBy?.name || body.name;
            const role = uploadedBy?.role || body.role;

            if (!taskId || !uid || !driveFileId) {
                console.error('[API /api/deliverables] Missing fields:', { taskId, uid, driveFileId });
                return NextResponse.json({ error: "Missing required fields (JSON)" }, { status: 400 });
            }

            // 1. Validate Task
            const taskRef = db.collection('tasks').doc(taskId);
            const taskSnap = await taskRef.get();
            if (!taskSnap.exists) {
                return NextResponse.json({ error: "Task not found" }, { status: 404 });
            }
            const taskData = taskSnap.data();

            // 2. Save Metadata to Firestore
            const deliverableRef = db.collection('deliverables').doc(); // Auto ID
            const deliverableData = {
                id: deliverableRef.id,
                taskId,
                driveFileId,
                fileName: fileName || 'Unknown File',
                originalFileName: fileName, // The service sends the final name as fileName
                fileType,
                fileSize,
                downloadUrl,
                version: version || 1,
                supersedes: supersedes || null,
                uploadedBy: { uid, name, role },
                createdAt: FieldValue.serverTimestamp(),
            };

            await deliverableRef.set(deliverableData);

            await logSystemActivity({
                actorId: uid,
                actorRole: role || 'viewer',
                action: 'file_published',
                entityType: 'drive_file',
                entityId: driveFileId,
                summary: `Deliverable Published: ${fileName}`,
                source: 'system',
                severity: 'info',
                visibility: { mode: 'admin' },
                metadata: {
                    taskId,
                    version: deliverableData.version
                }
            });

            // 3. Update Task Timestamps
            const taskUpdate: any = {
                updatedAt: FieldValue.serverTimestamp()
            };
            if (!taskData?.firstDeliverableAt) {
                taskUpdate.firstDeliverableAt = FieldValue.serverTimestamp();
            }
            await taskRef.update(taskUpdate);

            // 4. Trigger Notification (Optional - if needed for team uploads)
            // ...

            return NextResponse.json({ success: true, id: deliverableRef.id, createdAt: new Date().toISOString() });
        }

        // --- FORMDATA MODE (Legacy / Full Upload) ---
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const taskId = formData.get("taskId") as string;
        const uid = formData.get("uid") as string;
        const name = formData.get("name") as string;
        const role = formData.get("role") as string;
        // ... (rest of legacy logic handled by existing code blocks if we were merging, but I'm replacing the whole function mostly)

        if (!file || !taskId || !uid) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Google Drive Setup
        const drive = await getDriveClient();
        // 2. Folder management
        // Use the centralized logic to ensure the correct Task folder exists
        const taskRef = db.collection('tasks').doc(taskId);
        const taskSnap = await taskRef.get();
        if (!taskSnap.exists) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        const taskData = taskSnap.data();

        // Ensure Task Folder (handles Campaign vs Standalone internally)
        const taskFolderId = await ensureTaskFolder(taskId, taskData?.title, taskData?.campaignId);

        // 3. Determine Version Number (Pre-upload)
        // Querying all deliverables for task and finding max in JS to avoid composite index requirement.

        const deliverablesSnap = await db.collection('deliverables')
            .where('taskId', '==', taskId)
            .get();

        let version = 1;
        if (!deliverablesSnap.empty) {
            const versions = deliverablesSnap.docs.map(doc => doc.data().version || 0);
            const maxVersion = Math.max(...versions);
            version = maxVersion + 1;
        }

        // 4. Prepare File with Versioned Name
        const safeOriginalName = sanitizeForDrive(file.name);
        const versionedFileName = `v${version}_${safeOriginalName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // 5. Upload to Drive
        const driveResponse = await drive.files.create({
            requestBody: {
                name: versionedFileName,
                parents: [taskFolderId],
            },
            media: {
                mimeType: file.type,
                body: stream,
            },
            fields: "id, name, webViewLink, webContentLink",
            supportsAllDrives: true,
        });

        const driveFileId = driveResponse.data.id!;

        // 6. Set Permissions (Make Publicly Viewable for App Preview)
        await drive.permissions.create({
            fileId: driveFileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true,
        });

        // 7. Save Metadata to Firestore
        const deliverableRef = db.collection('deliverables').doc(); // Auto ID
        const deliverableData = {
            id: deliverableRef.id,
            taskId,
            driveFileId,
            fileName: versionedFileName, // Storing the actual Drive name
            originalFileName: file.name, // Good to keep original reference if needed
            version,
            uploadedBy: { uid, name, role },
            createdAt: FieldValue.serverTimestamp(),
        };

        await deliverableRef.set(deliverableData);

        // 8. Update Task Timestamps
        const taskUpdate: any = {
            updatedAt: FieldValue.serverTimestamp() // Always touch updatedAt
        };

        if (!taskData?.firstDeliverableAt) {
            taskUpdate.firstDeliverableAt = FieldValue.serverTimestamp();
        }

        await taskRef.update(taskUpdate);

        return NextResponse.json({ success: true, driveFileId, version, fileName: versionedFileName });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
        }

        const snapshot = await db.collection('deliverables')
            .where('taskId', '==', taskId)
            .get();

        const data = snapshot.docs
            .map(doc => {
                const d = doc.data();
                return {
                    ...d,
                    // Convert Timestamp to ISO string to ensure consistent serialization
                    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
                };
            })
            // Sort in memory: Newest (Highest version) first
            .sort((a, b) => ((b as any).version || 0) - ((a as any).version || 0));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

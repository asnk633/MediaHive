import { DriveFile } from './file';

export interface MediaComment {
  id: string; // Firestore ID
  mediaId: string; // Reference to the media file
  authorId: string; // UID of the commenter
  authorName: string; // Display name of the commenter
  authorRole: string; // Role of the commenter ('admin' | 'team' | 'guest')
  content: string; // The comment text
  createdAt: any; // Timestamp
}

export type ProofingStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected';

export interface ExtendedDriveFile extends DriveFile {
  // New proofing properties
  proofingStatus?: ProofingStatus;
  proofingStatusUpdatedAt?: any; // Timestamp
  proofingStatusUpdatedBy?: string; // UID of the user who last updated the status
  proofingStatusUpdatedByName?: string; // Display name of the user who last updated the status

  // Versioning properties
  versionGroupId?: string; // Shared ID across versions of the same file
  versionNumber?: number; // 1, 2, 3...
  isActiveVersion?: boolean; // Whether this is the active version

  // Task and event linking properties
  taskId?: string;
  eventId?: string;
}
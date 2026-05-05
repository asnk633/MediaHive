export type VisibilityMode = 'all' | 'include' | 'exclude';

export interface FileVisibility {
    mode: VisibilityMode;
    institutions?: string[];
    departments?: string[];
}

export interface DriveFile {
    id: string; // Firestore ID
    name: string;
    type: string; // 'poster' | 'video' | 'pdf' | 'other'
    mimeType: string;
    driveFileId: string;
    viewLink: string;
    downloadLink: string;
    previewLink?: string;
    uploaded_by: string; // uid
    uploadedByRole: string; // 'admin' | 'team'
    uploadedByName?: string; // Cache for display
    created_at: any; // Timestamp
    visibility: FileVisibility;
    department?: string;

    // Authorization Context (Strict Downloads Scope)
    uploadContext?: 'task_attachment' | 'task_final' | 'downloads_direct';
    isFinal?: boolean; // Derived from uploadContext (optional helper)

    // Proofing & Versions
    proofingStatus?: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    isActiveVersion?: boolean;
    version?: number;
    is_demo_data?: boolean;
    originalName?: string; // For SystemHealthPanel display
}

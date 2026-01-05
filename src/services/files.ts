import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll
} from 'firebase/storage';
import { getFirebaseStorage } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';

/**
 * Files Storage Service - Handles file uploads to Firebase Storage
 * and metadata storage in Firestore with real-time sync
 */

const FILES_STORAGE_PATH = 'files';
const FILES_COLLECTION = 'files';

export interface FileMetadata {
    id: string;
    userId: string;
    name: string; // Custom name
    originalName: string;
    size: number;
    type: string;
    storageUrl: string;
    storagePath: string;
    uploadedDate: string; // Using string instead of Timestamp
    uploadedBy: string;
}

/**
 * Upload a file to Firebase Storage and save metadata to Firestore
 * @param userId - The uploader's user ID
 * @param file - The file to upload
 * @param customName - Custom name for the file
 * @returns File metadata
 */
export async function uploadFile(
    userId: string,
    file: File,
    customName: string
): Promise<FileMetadata> {
    try {
        const storage = await getFirebaseStorage();
        
        // Generate unique file ID
        const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Create storage path: files/{userId}/{fileId}/{filename}
        const storagePath = `${FILES_STORAGE_PATH}/${userId}/${fileId}/${file.name}`;
        const storageRef = ref(storage, storagePath);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000',
        });

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Save metadata to API
        const metadata: Omit<FileMetadata, 'id'> = {
            userId,
            name: customName,
            originalName: file.name,
            size: file.size,
            type: file.type,
            storageUrl: downloadURL,
            storagePath,
            uploadedDate: new Date().toISOString(),
            uploadedBy: userId,
        };

        const result = await apiClient('/api/files', {
            method: 'POST',
            body: JSON.stringify({
                ...metadata
            })
        });

        return {
            id: result.id || fileId,
            ...metadata,
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file');
    }
}

/**
 * Subscribe to real-time file updates for a user or all files (admin)
 * @param userId - User ID to filter files, null for all files (admin)
 * @param callback - Callback function to receive file updates
 * @returns Unsubscribe function
 */
export function subscribeToFiles(
    userId: string | null,
    callback: (files: FileMetadata[]) => void
): () => void {
    let pollInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const pollFiles = async () => {
        if (isCancelled) return;
        
        try {
            const endpoint = userId ? `/api/files?userId=${userId}` : '/api/files';
            const result = await apiClient(endpoint, {
                method: 'GET'
            });
            
            const files = (result.files || []).map((file: any) => ({
                id: file.id,
                ...file,
                uploadedDate: file.uploadedDate || new Date().toISOString()
            }));
            
            callback(files);
        } catch (error) {
            console.warn('File polling failed:', error);
            callback([]);
        }
        
        if (!isCancelled) {
            pollInterval = setTimeout(pollFiles, 30000); // Poll every 30 seconds
        }
    };

    // Start polling immediately
    pollFiles();

    return () => {
        isCancelled = true;
        if (pollInterval) {
            clearTimeout(pollInterval);
        }
    };
}

/**
 * Delete a file from Storage and Firestore
 * @param fileId - Firestore document ID
 * @param storagePath - Firebase Storage path
 */
export async function deleteFile(fileId: string, storagePath: string): Promise<void> {
    try {
        const storage = await getFirebaseStorage();
        
        // Delete from Storage
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);

        // Delete from API
        await apiClient(`/api/files/${fileId}`, {
            method: 'DELETE'
        });
    } catch (error: any) {
        // Ignore if file doesn't exist in storage
        if (error.code !== 'storage/object-not-found') {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }

        // Still delete from API even if storage file is gone
        try {
            await apiClient(`/api/files/${fileId}`, {
                method: 'DELETE'
            });
        } catch (apiError) {
            console.error('Error deleting file metadata:', apiError);
        }
    }
}

/**
 * Get all files for a user (no real-time updates)
 * @param userId - User ID
 * @returns Array of file metadata
 */
export async function getFiles(userId: string): Promise<FileMetadata[]> {
    try {
        const result = await apiClient(`/api/files?userId=${userId}`, {
            method: 'GET'
        });
        
        return (result.files || []).map((file: any) => ({
            id: file.id,
            ...file,
            uploadedDate: file.uploadedDate || new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}
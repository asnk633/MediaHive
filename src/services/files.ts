import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll
} from 'firebase/storage';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { storage, db } from '@/firebase/client';

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
    uploadedDate: Timestamp;
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

        // Save metadata to Firestore
        const metadata: Omit<FileMetadata, 'id'> = {
            userId,
            name: customName,
            originalName: file.name,
            size: file.size,
            type: file.type,
            storageUrl: downloadURL,
            storagePath,
            uploadedDate: Timestamp.now(),
            uploadedBy: userId,
        };

        const docRef = await addDoc(collection(db, FILES_COLLECTION), metadata);

        return {
            id: docRef.id,
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
    try {
        // Build query
        let q;
        if (userId) {
            // Regular user: only their files
            q = query(
                collection(db, FILES_COLLECTION),
                where('userId', '==', userId),
                orderBy('uploadedDate', 'desc')
            );
        } else {
            // Admin: all files
            q = query(
                collection(db, FILES_COLLECTION),
                orderBy('uploadedDate', 'desc')
            );
        }

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const files = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FileMetadata));

            callback(files);
        }, (error) => {
            console.error('Error subscribing to files:', error);
            callback([]);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up file subscription:', error);
        return () => { };
    }
}

/**
 * Delete a file from Storage and Firestore
 * @param fileId - Firestore document ID
 * @param storagePath - Firebase Storage path
 */
export async function deleteFile(fileId: string, storagePath: string): Promise<void> {
    try {
        // Delete from Storage
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);

        // Delete from Firestore
        await deleteDoc(doc(db, FILES_COLLECTION, fileId));
    } catch (error: any) {
        // Ignore if file doesn't exist in storage
        if (error.code !== 'storage/object-not-found') {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }

        // Still delete from Firestore even if storage file is gone
        try {
            await deleteDoc(doc(db, FILES_COLLECTION, fileId));
        } catch (firestoreError) {
            console.error('Error deleting file metadata:', firestoreError);
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
        const q = query(
            collection(db, FILES_COLLECTION),
            where('userId', '==', userId),
            orderBy('uploadedDate', 'desc')
        );

        return new Promise((resolve, reject) => {
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const files = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FileMetadata));

                unsubscribe();
                resolve(files);
            }, (error) => {
                unsubscribe();
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}

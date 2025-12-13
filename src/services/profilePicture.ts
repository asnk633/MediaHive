import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/firebase/client';

/**
 * Profile Picture Service - Handles uploading, retrieving, and deleting profile pictures
 * using Firebase Storage
 */

const PROFILE_PICTURES_PATH = 'profile-pictures';

/**
 * Upload a profile picture to Firebase Storage
 * @param userId - The user's unique ID
 * @param imageBlob - The cropped image as a Blob
 * @returns Download URL for the uploaded image
 */
export async function uploadProfilePicture(userId: string, imageBlob: Blob): Promise<string> {
    try {
        // Create a reference to the storage location
        // Path: profile-pictures/{userId}/avatar.jpg
        const storageRef = ref(storage, `${PROFILE_PICTURES_PATH}/${userId}/avatar.jpg`);

        // Upload the image
        const snapshot = await uploadBytes(storageRef, imageBlob, {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=31536000', // Cache for 1 year
        });

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Cache the URL in localStorage for faster loads
        if (typeof window !== 'undefined') {
            localStorage.setItem('userAvatarUrl', downloadURL);
        }

        return downloadURL;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw new Error('Failed to upload profile picture');
    }
}

/**
 * Get the profile picture URL for a user
 * @param userId - The user's unique ID
 * @returns Download URL or null if not found
 */
export async function getProfilePictureUrl(userId: string): Promise<string | null> {
    try {
        // Check localStorage cache first
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('userAvatarUrl');
            if (cached) {
                return cached;
            }
        }

        // Get from Firebase Storage
        const storageRef = ref(storage, `${PROFILE_PICTURES_PATH}/${userId}/avatar.jpg`);
        const downloadURL = await getDownloadURL(storageRef);

        // Cache for future use
        if (typeof window !== 'undefined') {
            localStorage.setItem('userAvatarUrl', downloadURL);
        }

        return downloadURL;
    } catch (error: any) {
        // If file doesn't exist (error code 'storage/object-not-found'), return null
        if (error.code === 'storage/object-not-found') {
            return null;
        }

        console.error('Error fetching profile picture:', error);
        return null;
    }
}

/**
 * Delete a user's profile picture
 * @param userId - The user's unique ID
 */
export async function deleteProfilePicture(userId: string): Promise<void> {
    try {
        const storageRef = ref(storage, `${PROFILE_PICTURES_PATH}/${userId}/avatar.jpg`);
        await deleteObject(storageRef);

        // Clear localStorage cache
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userAvatarUrl');
            localStorage.removeItem('userAvatar'); // Old base64 key
        }
    } catch (error: any) {
        // Ignore if file doesn't exist
        if (error.code !== 'storage/object-not-found') {
            console.error('Error deleting profile picture:', error);
            throw new Error('Failed to delete profile picture');
        }
    }
}

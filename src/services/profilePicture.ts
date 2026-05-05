import { apiClient } from '@/lib/apiClient';

/**
 * Profile Picture Service - Handles uploading, retrieving, and deleting profile pictures
 * using server-side Drive integration.
 */

const PROFILE_PICTURES_PATH = 'profile-pictures'; // Still kept if useful for other refs, or remove. Actually unused now.

/**
 * Upload a profile picture to MOCK_KEY Storage
 * @param userId - The user's unique ID
 * @param imageBlob - The cropped image as a Blob
 * @returns Download URL for the uploaded image
 */
export async function uploadProfilePicture(userId: string, imageBlob: Blob): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', imageBlob);

        // Upload via our server API (which routes to Google Drive)
        // Note: userId is derived from session on the server side for security
        const response = await apiClient<any>('/api/users/me/avatar', {
            method: 'POST',
            body: formData,
        });

        if (response.error) {
            throw new Error(response.error || 'Upload failed');
        }

        const downloadURL = response.avatar_url;

        // Cache the URL in localStorage for faster loads
        if (typeof window !== 'undefined') {
            localStorage.setItem('userAvatarUrl', downloadURL);
        }

        return downloadURL;
    } catch (error: any) {
        console.error('Error uploading profile picture:', error);
        throw new Error(error.message || 'Failed to upload profile picture. Please try again.');
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

        // Get from API
        const userData = await apiClient(`/api/users/${userId}`, {
            method: 'GET'
        });

        const downloadURL = userData?.avatar_url || null;

        // Cache for future use
        if (typeof window !== 'undefined' && downloadURL) {
            localStorage.setItem('userAvatarUrl', downloadURL);
        }

        return downloadURL;
    } catch (error: any) {
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
        // Delete via API
        await apiClient(`/api/users/me`, {
            method: 'PATCH',
            body: JSON.stringify({
                avatar_url: null,
                avatar_updated_at: new Date().toISOString()
            })
        });

        // Clear localStorage cache
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userAvatarUrl');
            localStorage.removeItem('userAvatar'); // Old base64 key
        }
    } catch (error: any) {
        console.error('Error deleting profile picture:', error);
        throw error;
    }
}

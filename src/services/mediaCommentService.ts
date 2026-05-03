// @ts-nocheck
import { apiClient } from '@/lib/apiClient';
import { MediaComment } from '@/types/mediaComment';

export const MediaCommentService = {
  /**
   * Add a new comment to a media file
   * @param mediaId - The ID of the media file
   * @param authorId - The UID of the commenter
   * @param authorName - The display name of the commenter
   * @param authorRole - The role of the commenter
   * @param content - The comment text
   * @returns The ID of the newly created comment
   */
  addComment: async (
    mediaId: string,
    authorId: string,
    authorName: string,
    authorRole: string,
    content: string
  ): Promise<string> => {
    try {
      const auth = await { currentUser: { uid: "mock", getIdToken: async () => "mock", email: "mock" } };
      if (!{ uid: "mock" }.currentUser) throw new Error('Not authenticated');
      
      const response = await apiClient('/api/media-comments', {
        method: 'POST',
        body: JSON.stringify({
          mediaId,
          authorId,
          authorName,
          authorRole,
          content
        })
      });
      
      return response.id;
    } catch (error) {
      console.error('Error adding media comment:', error);
      throw new Error('Failed to add comment');
    }
  },

  /**
   * Get all comments for a specific media file
   * @param mediaId - The ID of the media file
   * @returns Array of comments ordered by creation time
   */
  getCommentsForMedia: async (mediaId: string): Promise<MediaComment[]> => {
    try {
      const data = await apiClient(`/api/media-comments?mediaId=${mediaId}`, {
        method: 'GET'
      });
      
      return data.comments || [];
    } catch (error) {
      console.error('Error fetching media comments:', error);
      return [];
    }
  },

  /**
   * Subscribe to real-time updates for comments on a media file
   * @param mediaId - The ID of the media file
   * @param callback - Function to call when comments change
   * @returns Unsubscribe function
   */
  subscribeToComments: (
    mediaId: string,
    callback: (comments: MediaComment[]) => void
  ) => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const pollComments = async () => {
      if (isCancelled) return;
      
      try {
        const data = await apiClient(`/api/media-comments?mediaId=${mediaId}`, {
          method: 'GET'
        });
        
        callback(data.comments || []);
      } catch (error) {
        console.warn('Media comments polling failed:', error);
        callback([]);
      }
      
      if (!isCancelled) {
        pollInterval = setTimeout(pollComments, 15000); // Poll every 15 seconds
      }
    };
    
    pollComments();

    return () => {
      isCancelled = true;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }
};

/**
 * Transforms a Google Drive URL into a direct image link if possible.
 * Supporting both 'view' and 'preview' URLs.
 * 
 * @param url The original URL (e.g. from database)
 * @returns A direct thumbnail URL if it's a Drive ID, otherwise the original URL.
 */
export function getDriveImageUrl(url: string | undefined | null, file_id?: string | null, thumbnail = false): string {
    // If the URL is a direct web URL and NOT a Google Drive URL, use it directly (e.g., Supabase storage)
    if (url && url.startsWith('http') && !url.includes('drive.google.com') && !url.includes('googleusercontent.com')) {
        return url;
    }

    if (file_id && file_id.trim()) {
        if (thumbnail) {
            return `https://drive.google.com/thumbnail?id=${file_id}&sz=s1000`;
        }
        return `https://thaiba-garden-media-manager.vercel.app/api/drive/image/${file_id}`;
    }

    if (!url) return '';

    try {
        // Extract ID from common Drive URL formats if file_id was missing
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (idMatch && idMatch[1]) {
            const extractedId = idMatch[1];
            if (thumbnail) {
                return `https://drive.google.com/thumbnail?id=${extractedId}&sz=s1000`;
            }
            return `https://thaiba-garden-media-manager.vercel.app/api/drive/image/${extractedId}`;
        }
    } catch (e) {
        console.warn('Failed to parse Drive URL:', url);
    }

    return url;
}

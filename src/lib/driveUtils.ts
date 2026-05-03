/**
 * Transforms a Google Drive URL into a direct image link if possible.
 * Supporting both 'view' and 'preview' URLs.
 * 
 * @param url The original URL (e.g. from database)
 * @returns A direct thumbnail URL if it's a Drive ID, otherwise the original URL.
 */
export function getDriveImageUrl(url: string | undefined | null, file_id?: string | null): string {
    if (file_id) {
        return `/api/drive/image/${file_id}`;
    }
    if (!url) return '';

    try {
        // Extract ID from common Drive URL formats
        // Matches: /file/d/ID/view, /uc?id=ID, /open?id=ID
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (idMatch && idMatch[1]) {
            const extractedId = idMatch[1];
            // Use our secure server-side proxy to bypass CORS/Auth issues on localhost
            return `/api/drive/image/${extractedId}`;
        }
    } catch (e) {
        console.warn('Failed to parse Drive URL:', url);
    }

    return url;
}

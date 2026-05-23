/**
 * Transforms a Google Drive URL into a direct image link if possible.
 * Supporting both 'view' and 'preview' URLs.
 * 
 * @param url The original URL (e.g. from database)
 * @returns A direct thumbnail URL if it's a Drive ID, otherwise the original URL.
 */
export function getDriveImageUrl(url: string | undefined | null, file_id?: string | null, thumbnail = false): string {
    // Use our local API proxy to fetch the image via the Drive API.
    // This avoids 403 Forbidden errors from Google's lh3 proxy.
    if (file_id && file_id.trim()) {
        const query = thumbnail ? '?thumbnail=true' : '';
        return `/api/drive/image/${file_id}${query}`;
    }

    if (!url) return '';

    try {
        // Extract ID from common Drive URL formats if file_id was missing
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (idMatch && idMatch[1]) {
            const extractedId = idMatch[1];
            const query = thumbnail ? '?thumbnail=true' : '';
            return `/api/drive/image/${extractedId}${query}`;
        }
    } catch (e) {
        console.warn('Failed to parse Drive URL:', url);
    }

    return url;
}

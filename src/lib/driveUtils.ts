/**
 * Transforms a Google Drive URL into a direct image link if possible.
 * Supporting both 'view' and 'preview' URLs.
 * 
 * @param url The original URL (e.g. from database)
 * @returns A direct thumbnail URL if it's a Drive ID, otherwise the original URL.
 */
export function getDriveImageUrl(url: string | undefined | null): string {
    if (!url) return '';

    try {
        // Extract ID from common Drive URL formats
        // Matches: /file/d/ID/view, /uc?id=ID, /open?id=ID
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (idMatch && idMatch[1]) {
            const fileId = idMatch[1];
            // Use the thumbnail API which is more reliable for <img> tags than /uc often is for private/mixed files
            // sz=w1000 requests a large version (up to 1000px width)
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
    } catch (e) {
        console.warn('Failed to parse Drive URL:', url);
    }

    return url;
}

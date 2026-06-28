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

    const resolveId = (id: string) =>
        // Use sz=s1000 for thumbnail cases, sz=s800 for non-thumbnail
        `https://drive.google.com/thumbnail?id=${id}&sz=${thumbnail ? 's1000' : 's800'}`;

    if (file_id && file_id.trim()) {
        return resolveId(file_id.trim());
    }

    if (!url) return '';

    try {
        // Extract ID from common Drive URL formats if file_id was missing
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (idMatch && idMatch[1]) {
            const extractedId = idMatch[1];
            return resolveId(extractedId);
        }
    } catch (e) {
        console.warn('Failed to parse Drive URL:', url);
    }

    return url;
}

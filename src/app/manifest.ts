import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MediaHive',
        short_name: 'MediaHive',
        description: 'Media management system for Thaiba Garden',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f172a', // Aura dark blue
        theme_color: '#0f172a',
        icons: [
            {
                src: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        orientation: 'portrait',
        prefer_related_applications: false,
    };
}

// src/utils/detect-dom-modifications.ts
"use client";

export function detectDomModifications() {
    if (process.env.NODE_ENV === 'production') return;
    if (typeof window === 'undefined') return;

    const checkAttributes = () => {
        const html = document.documentElement;
        const suspiciousPatterns = [/jetski/i, /jetpack/i, /extension/i];

        const attributes = Array.from(html.attributes);
        const suspicious = attributes.filter(attr =>
            suspiciousPatterns.some(pattern => pattern.test(attr.name))
        );

        if (suspicious.length > 0) {
            console.warn(
                '%c[Hydration Warning] Suspicious attributes detected on <html> tag:',
                'background: #ffcc00; color: #000; padding: 4px; border-radius: 4px; font-weight: bold;'
            );
            suspicious.forEach(attr => {
                console.warn(`- ${attr.name}="${attr.value}"`);
            });
            console.info(
                'These attributes are likely injected by browser extensions and may cause hydration errors in Next.js.\n' +
                'Please disable extensions or ignore if UI is unaffected.\n' +
                'See docs/dev-notes/hydration-errors.md for more info.'
            );
        }
    };

    // Run on load and after a short delay
    if (document.readyState === 'complete') {
        checkAttributes();
    } else {
        window.addEventListener('load', checkAttributes);
    }

    // Also observe for changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.target === document.documentElement) {
                checkAttributes();
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });
}

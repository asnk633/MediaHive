/**
 * Debug Safe Areas Script
 * 
 * Inject this script into the browser console to inspect:
 * 1. Safe Area CSS Variables
 * 2. Computed Safe Area values
 * 3. TopBar and BottomNav dimensions
 * 4. Content Offset padding
 */

(function debugSafeAreas() {
    const docInfo = {
        title: document.title,
        url: window.location.href,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            visualViewport: {
                width: window.visualViewport?.width,
                height: window.visualViewport?.height,
                offsetTop: window.visualViewport?.offsetTop,
            }
        }
    };

    const vars = [
        '--safe-area-top',
        '--safe-area-bottom',
        '--computed-safe-top',
        '--computed-safe-bottom',
        '--topbar-height',
        '--bottom-nav-height',
        '--fab-offset'
    ];

    const computedVars = {};
    const rootStyle = getComputedStyle(document.documentElement);
    vars.forEach(v => {
        computedVars[v] = rootStyle.getPropertyValue(v).trim();
    });

    // Element Rects
    const topBar = document.querySelector('.topbar');
    const bottomNav = document.querySelector('.bottom-nav');
    const fabMain = document.querySelector('.fab-main');
    const contentOffset = document.querySelector('.content-offset');
    const greeting = document.querySelector('header h1'); // Heuristic for greeting

    const inputData = {
        topBar: topBar ? topBar.getBoundingClientRect() : null,
        bottomNav: bottomNav ? bottomNav.getBoundingClientRect() : null,
        fabMain: fabMain ? fabMain.getBoundingClientRect() : null,
        contentOffset: contentOffset ? {
            rect: contentOffset.getBoundingClientRect(),
            computedPaddingTop: getComputedStyle(contentOffset).paddingTop
        } : null,
        greeting: greeting ? greeting.getBoundingClientRect() : null,
    };

    const report = {
        timestamp: new Date().toISOString(),
        docInfo,
        cssVariables: computedVars,
        elements: inputData,
        analysis: {
            hasSafeTop: parseFloat(computedVars['--computed-safe-top'] || '0') > 0,
            hasSafeBottom: parseFloat(computedVars['--computed-safe-bottom'] || '0') > 0,
            topBarVisible: !!topBar,
            bottomNavVisible: !!bottomNav,
        }
    };

    console.table(computedVars);
    console.log('[DEBUG-SAFE-AREAS] Full Report:', report);
    return report;
})();

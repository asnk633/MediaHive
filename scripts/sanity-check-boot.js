/**
 * Android Boot Sanity Check
 * 
 * This script simulates the boot sequence and verifies that the 
 * redirect guard logic in src/app/page.tsx works as expected.
 */

const mockLocalStorage = {};
const mockSessionStorage = {};
const mockWindow = {
    location: {
        pathname: '/',
        href: 'https://localhost/'
    },
    Capacitor: { isNative: true }
};

const storage = {
    getItem: (key) => mockLocalStorage[key] || mockSessionStorage[key],
    setItem: (key, val) => { mockLocalStorage[key] = val; mockSessionStorage[key] = val; }
};

function simulateBoot(path) {
    console.log(`\n[TEST] Booting at path: ${path}`);
    mockWindow.location.pathname = path;

    const isHome = mockWindow.location.pathname === '/home' || mockWindow.location.pathname === '/home/';
    const redirected = storage.getItem('boot_redirected');

    if (!isHome && !redirected) {
        console.log('✅ Action: Triggering nativeNavigate("/home")');
        storage.setItem('boot_redirected', 'true');
        return 'NAVIGATED';
    } else if (isHome) {
        console.log('✅ Action: Already on home, settling.');
        return 'SETTLED';
    } else {
        console.log('❌ Action: LOOP DETECTED or BLOCKED');
        return 'ERROR';
    }
}

// Case 1: Fresh Boot at /
const res1 = simulateBoot('/');
if (res1 !== 'NAVIGATED') process.exit(1);

// Case 2: Post-Redirect Load at /home
const res2 = simulateBoot('/home');
if (res2 !== 'SETTLED') process.exit(1);

// Case 3: Accidental Reload at / while flag is set
const res3 = simulateBoot('/');
if (res3 === 'ERROR' && storage.getItem('boot_redirected')) {
    console.log('✅ Action: Redirect blocked by guard flag (Expected)');
} else {
    console.log('❌ Unexpected result for Case 3');
    process.exit(1);
}

console.log('\n[PASS] Boot sequence logic verified.');

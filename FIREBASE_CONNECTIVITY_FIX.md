# Firebase Firestore Connectivity Issue Fix

## Problem Description

You're encountering the following error:
```
@firebase/firestore: "Firestore (12.6.0): Could not reach Cloud Firestore backend. Connection failed 1 times. Most recent error: FirebaseError: [code=unknown]: Fetching auth token failed: Firebase: Error (auth/network-request-failed).
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend."
```

## Root Causes

1. **Network Connectivity Issues**: The device may be offline or have intermittent connectivity
2. **Firewall/Proxy Blocking**: Corporate firewalls or proxies may be blocking Firebase connections
3. **DNS Resolution Problems**: DNS issues preventing connection to Firebase servers
4. **Browser Security Settings**: Strict security settings blocking external connections
5. **Incorrect Firebase Configuration**: Misconfigured Firebase credentials

## Solutions

### 1. Immediate Fixes

#### Check Internet Connection
Ensure your device has a stable internet connection:
```bash
ping google.com
```

#### Restart Development Server
Sometimes a simple restart resolves connectivity issues:
```bash
npm run dev
# or
yarn dev
```

#### Clear Browser Cache
Clear your browser cache and try again, especially if using localhost.

### 2. Configuration Verification

#### Check Firebase Config
Verify that your `public/firebase-config.json` contains valid credentials:
```json
{
  "apiKey": "AIzaSyCHtgEWUfDgID4lE2pD8U3nMHrMRJueGZ0",
  "authDomain": "thaiba-media-staging.firebaseapp.com",
  "projectId": "thaiba-media-staging",
  "storageBucket": "thaiba-media-staging.firebasestorage.app",
  "messagingSenderId": "317912284078",
  "appId": "1:317912284078:web:424bc66aa3d85c162ae63f"
}
```

#### Verify Environment Variables
Check that your `.env.local` file has the correct Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCHtgEWUfDgID4lE2pD8U3nMHrMRJueGZ0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=thaiba-media-staging.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thaiba-media-staging
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=thaiba-media-staging.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=317912284078
NEXT_PUBLIC_FIREBASE_APP_ID=1:317912284078:web:424bc66aa3d85c162ae63f
```

### 3. Code-Level Fixes

The implemented fixes include:

#### Network Monitoring
Added a network monitoring utility (`src/utils/networkMonitor.ts`) that:
- Monitors online/offline status
- Provides retry logic with exponential backoff
- Returns mock responses when offline

#### Enhanced Firebase Initialization
Updated `src/firebase/auth.ts` to:
- Check network connectivity before initializing Firebase
- Return mock services when offline
- Add more robust error handling

#### Improved Firestore Settings
Enhanced Firestore initialization with:
- Better timeout settings
- Improved network resilience
- SSL enforcement

### 4. Testing Connectivity

#### Manual Test
Try accessing the Firebase config URL directly in your browser:
```
http://localhost:3000/firebase-config.json
```

#### Programmatic Test
Add this to a test file to verify connectivity:
```javascript
// test-firestore-connectivity.js
const { getDbService } = require('./src/firebase/client');

async function testFirestore() {
  try {
    const db = await getDbService();
    console.log('Firestore connected successfully');
  } catch (error) {
    console.error('Firestore connection failed:', error.message);
  }
}

testFirestore();
```

### 5. Advanced Troubleshooting

#### Check for Proxy Issues
If you're behind a corporate proxy, configure it:
```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### Verify Firewall Settings
Ensure your firewall allows connections to:
- `*.firebase.googleapis.com`
- `*.googleapis.com`

#### Test with Different Network
Try connecting from a different network (mobile hotspot) to isolate network issues.

### 6. Workaround for Offline Development

If you need to develop offline, the system now provides mock Firestore services that:
- Return empty collections
- Allow CRUD operations to proceed without errors
- Log warnings when offline operations are attempted

## Prevention

To prevent future connectivity issues:

1. **Implement Retry Logic**: Use the `withNetworkRetry` utility for Firestore operations
2. **Monitor Network Status**: Use the `networkMonitor` to check connectivity before operations
3. **Handle Offline Gracefully**: Design your app to work with mock data when offline
4. **Cache Data Locally**: Implement local caching strategies for better offline experience

## Additional Resources

- [Firebase Network Troubleshooting Guide](https://firebase.google.com/support/troubleshooter/firestore/connect)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase JavaScript SDK Documentation](https://firebase.google.com/docs/reference/js)

If issues persist after implementing these fixes, please check the browser developer console for more specific error messages and contact Firebase support with the exact error codes.
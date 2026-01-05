# Claims-Based Authorization Setup and Verification Guide

## Overview
This document outlines the complete setup and verification process for the claims-based authorization system with Super Admin functionality.

## 1. Super Admin Setup

### Bootstrap Super Admin
To set up the Super Admin account (`media@thaibagarden.com`) with the required claims:

```bash
# Deploy the Cloud Functions first
firebase deploy --only functions

# Then trigger the bootstrap function via HTTP POST
curl -X POST https://[YOUR_REGION]-[PROJECT_ID].cloudfunctions.net/bootstrapSuperAdmin
```

Alternatively, use the verification script:
```bash
node scripts/verify-super-admin.js
```

### Required Claims
The Super Admin user should have these custom claims:
```json
{
  "superAdmin": true,
  "admin": true,
  "isTeam": true
}
```

## 2. Verification Steps

### A. Verify Super Admin Claims
Run the verification script to confirm claims are properly set:
```bash
node scripts/verify-super-admin.js
```

Or use Firebase CLI:
```bash
firebase auth:export users.json --project thaiba-media-staging
```

### B. Check Token Claims in Browser Console
After logging in, open browser DevTools and run:
```javascript
firebase.auth().currentUser.getIdTokenResult(true).then((result) => {
  console.log('[AUTH CLAIMS]', result.claims);
});
```

Expected output should include:
- `superAdmin: true`
- `admin: true`
- `isTeam: true`

## 3. Claims-Ready Hard Gate

### AuthContext Updates
The AuthContext now includes:
- `claimsReady: boolean` - indicates when claims are loaded
- Token refresh logic to ensure latest claims are available
- Proper role determination based on claims

### Using Claims in Components
All components that access Firestore should wait for claims to be ready:

```typescript
const { user, loading, claimsReady } = useAuth();

if (loading || !claimsReady) {
  return <div>Loading...</div>;
}

// Now safe to access Firestore data based on user roles
if (user?.isSuperAdmin) {
  // Show super admin UI
} else if (user?.isAdmin) {
  // Show admin UI
} else if (user?.isTeam) {
  // Show team UI
}
```

## 4. Service Worker Cache Clearing

If you're still experiencing permission errors after implementing the claims system, clear browser cache:

1. Open DevTools (F12)
2. Go to Application tab
3. Clear:
   - Service Workers → Unregister
   - Cache Storage → Clear
   - IndexedDB → Clear
   - Local Storage → Clear
4. Hard refresh (Ctrl+Shift+R)

## 5. Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions" still occurring**
   - Ensure token is refreshed after login: `await user.getIdToken(true)`
   - Verify claims are loaded before accessing Firestore
   - Check that service worker cache is cleared

2. **Super Admin claims not applied**
   - Run the bootstrap function again
   - Verify the user email is exactly `media@thaibagarden.com`
   - Check Firebase Auth console for custom claims

3. **Role-based UI not updating**
   - Ensure all components wait for `claimsReady` flag
   - Check that token refresh is happening after login
   - Verify custom claims are properly set in Firebase Auth

## 6. Security Notes

- Custom claims are the only source of truth for authorization
- Firestore rules rely solely on `request.auth.token` claims
- Never use Firestore document fields for authorization decisions
- Super Admin has full access to all collections
- Regular users can only access their own profile data
- Team members can access shared collections (notifications, tasks, etc.)
- Admins can manage user roles and access all data

## 7. Deployment Checklist

Before deploying to production:

- [ ] Deploy Cloud Functions with bootstrap and claims management
- [ ] Run Super Admin bootstrap function
- [ ] Verify claims are set correctly
- [ ] Test all role-based access levels
- [ ] Clear service worker cache on all devices
- [ ] Verify token refresh works properly
- [ ] Confirm claims-ready hard gate is functioning
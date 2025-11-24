# Hydration Errors & Browser Extensions

## The Issue
You may encounter hydration errors in the browser console during development, such as:
```
Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated.
Warning: Prop `data-jetski-tab-id` did not match. Server: null Client: "1465774433"
```

## Cause
This is typically caused by browser extensions injecting attributes or elements into the DOM (often on the `<html>` or `<body>` tags) before React hydrates the page. Since the server-rendered HTML does not contain these attributes, React flags a mismatch.

Common culprits include:
- Password managers (LastPass, 1Password)
- Ad blockers
- Shopping assistants (Honey, etc.)
- "Jetski" or similar tab managers

## Solution
These errors are generally harmless in production (as hydration warnings are stripped), but they can be annoying in development.

### How to Fix
1. **Disable Extensions**: Run the app in an Incognito/Private window or a clean browser profile to verify the error disappears.
2. **Ignore**: If the error is confirmed to be from an extension, you can safely ignore it.
3. **Suppress**: We have added a detector (`src/utils/detect-dom-modifications.ts`) that logs a friendly warning if it detects known extension patterns.

## Internal Hydration Issues
If the error persists in Incognito mode, it is a legitimate bug in our code. Look for:
- `Math.random()` or `Date.now()` used during render.
- `localStorage` access during initial render (use `useEffect` instead).
- `typeof window` checks affecting render output.

Report these internal issues to the engineering team.

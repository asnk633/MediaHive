# MediaHive Website 3D Scene — Fix All Issues

## Task
Fix all 6 blocking issues in `main.js`. The full task brief is at:
`C:\Users\Shukoor Rahman\.gemini\antigravity\brain\7f445fd0-f22c-44c1-9d45-2066a7d9f089\opencode_task.md`

Read that file first, then make all the changes described. After each major change, run:
```
node screenshot_playwright.js
```

The dev server is already running at localhost:3000.

## Priority Order
1. Fix shadow stripe artifacts (Issue 1)
2. Fix lighting to match Blender reference (Issue 2)  
3. Add scroll-driven chair fade (Issue 3)
4. Fix laptop screen video (Issue 4)
5. Add Platform Overview prop fade (Issue 5)
6. Add canvas hide after hero section (Issue 6)

## Key Files
- `main.js` — main Three.js file (2144 lines)
- `index.html` — page structure
- `/public/` — check for video and env files

## Never touch
- `node_modules/`
- `versions/` backup files

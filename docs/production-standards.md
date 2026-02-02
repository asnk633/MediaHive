# Production Engineering Standards (Platinum Tier)

This document outlines the mandatory operating principles for all contributors to the Thaiba MediaHive Android platform. Every change must be weighed against these standards.

## 📐 Operating Principles

### 1. Production-First Engineering
- No experimental hacks without guardrails.
- Every change must include: **Telemetry**, **Rollback Plan**, **Failure Mode Analysis**, and **Android Policy Compliance**.
- Prefer boring, deterministic systems over clever code.

### 2. Android OS Respect
- **Background**: WorkManager ONLY. No JS polling timers.
- **Constraints**: Follow Doze/App Standby rules. Use exponential backoff.
- **Security**: Honor Network Security Config (HTTPS enforced).
- **Hardening**: Use StrictMode and preserve ProGuard/R8 minification.

### 3. Capacitor + Next.js Hybrid Rules
- **Static Export**: Required for Android assets.
- **Navigation**: Use `nativeNavigate` for all programmatic redirects. NO `router.push`, `redirect()`, or RSC fetches during boot.
- **Guards**: Preserve boot loop guards and watchdog timers (`RootProviders.tsx`).

### 4. Performance Budgets (Hard Thresholds)
| Metric | Max Limit |
|--------|-----------|
| Cold boot TTI (Real Device) | 4s |
| Emulator boot | 6s |
| ANR rate | < 0.47% |
| Crash rate | < 1.0% |
| Jank frames | < 8% |
| APK size | < 25.0MB |
| Peak JS heap | < 150MB |
| Idle battery drain | < 3% / 10 min |

### 5. Mandatory Instrumentation
- Every system must: Log `[BOOT][STEP]`, emit telemetry, be timeout-protected, and have a watchdog fallback UI.

### 6. Regression Protection
- ESLint rules blocking forbidden navigation APIs must remain active.
- CI enforcement of boot sanity checks is mandatory.

### 7. Battery & Background Discipline
- Minimize wakeups. Use `WorkManager` with `UNMETERED` and `BatteryNotLow` constraints for heavy sync.

### 8. GPU & Rendering
- Avoid `backdrop-filter`, heavy shadows, and layout thrashing.
- Measure jank via `JankMonitor` and `Android GPU Inspector`.

### 9. Memory Safety
- `AbortController` required for ALL fetches.
- Strict cleanup on component unmount (`useEffect` return).
- No retained listeners or setInterval leaks.

### 10. Release & Rollout Discipline
- Staged rollouts (1% -> 10% -> 50% -> 100%).
- Automatic rollback alerts tied to telemetry gates.
- Crash-loop breaker must always protect the hydration path.

## 🧪 Required Proposal Format
When proposing changes, provide:
- **Risk Assessment**
- **Android Policy Impact**
- **Performance/Battery/Memory Impact**
- **Play Console Metrics Affected**
- **Telemetry Added**
- **Rollback Strategy**
- **Test Plan**

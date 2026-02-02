# Security & Privacy Compliance (Enterprise Tier)

This document outlines the security architecture and privacy governance implemented for the Thaiba MediaHive Android platform.

## 🧭 Governance Principles

### 1. Privacy by Design
- **Minimum Data**: Only operational IDs and performance metrics are collected.
- **Opt-Out**: Telemetry can be disabled via the `PrivacyCenter` component.
- **Anonymization**: Telemetry identifiers are rotated regularly.

### 2. Permission Minimalism
- **Pruned Manifest**: Only `android.permission.INTERNET` is requested.
- **Just-in-Time**: No pre-granting of dangerous permissions.

### 3. Data Classification & Retention
| Class | Storage | Encryption | TTL |
|-------|---------|------------|-----|
| **Operational** | IndexedDB | AES (Optional) | User Session |
| **Sensitive** | Native Vault | EncryptedSharedPreferences | App Lifecycle |
| **Telemetry** | Firebase | TLS 1.2+ | 30 Days |

- **Erasure**: Users can request data deletion via the `PrivacyCenter`.
- **Retention**: Local caches are cleared after 60 days of inactivity.

### 4. Encryption Standards
- **In-Transit**: Mandatory TLS 1.2+ for all API communication.
- **At-Rest**: Sensitive session tokens are stored using native-backed encryption where supported by the platform.
- **Hardening**: `network_security_config.xml` blocks all cleartext traffic for production domains.

### 5. Native & Hybrid Hardening
- **Root Detection**: `MainActivity.java` monitors for SU binaries and restricting sensitive operations on compromised devices.
- **Screenshot Protection**: `FLAG_SECURE` is active in production builds to prevent data exfiltration.
- **WebView Debugging**: Explicitly disabled in production builds (`BuildConfig.DEBUG` gate).
- **Navigation Locking**: `nativeNavigate` ensures no unauthorized origin redirects.

### 6. Regulatory Alignment (GDPR)
- **Data Export**: `PrivacyCenter` allows users to download their operational data in JSON format.
- **Consent Tracking**: Opt-in/out states are persisted and respected across app restarts.
- **Registry**: All data flows are documented in the internal engineering wiki.

## 🚨 Incident Response
In case of a suspected breach:
1. **Remote Kill**: Use Firebase auth revocation to invalidate all active sessions.
2. **Telemetry Audit**: Analyze `anr_warning` and `crash_count` spikes.
3. **Rollback**: Halt staged rollouts in Google Play Console if security thresholds are breached.

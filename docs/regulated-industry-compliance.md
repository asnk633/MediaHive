# Regulated Industry Compliance Guide (HIPAA/PCI/SOC2)

This document outlines the controls and architectural patterns implemented to ensure compliance with regulated industry standards such as HIPAA (Privacy/Security), PCI-DSS (Data Integrity), and SOC2 (Availability/Confidentiality).

## 1. Data Classification Registry
All operational data fields in the Media Manager ecosystem are mapped to a classification registry:
- **PII (Personally Identifiable Information)**: User profiles, telemetry actor IDs.
- **Operational Data**: Garden telemetry, task lists, inventory counts.
- **Sensitive Data**: Hardware access tokens, encryption keys.

## 2. Step-up Authentication Infrastructure
Critical operations (e.g., modifying security gates or purging audit logs) require "Step-up Auth". 
- **Implementation**: The UI triggers a re-verification prompt (e.g., password re-entry or Biometric challenge via Capacitor) before issuing high-privilege commands.
- **Reference**: See `AuthContext.tsx` step-up logic.

## 3. Dual-Confirmation Safety Controls
Any action affecting physical hardware (actuators, pumps) requires dual-operator confirmation or a staggered confirmation overlay.
- **Pattern**: "System Arm" -> "Operator Confirm" -> "Action Execute".
- **Safety**: Hard-coded operational ceilings prevent software overrides from exceeding physical limits.

## 4. Encrypted Field-Level Storage
Sensitive local stores use `SecureStorage` or field-level AES encryption to ensure that even if a device is compromised, sensitive metadata remains opaque.
- **Storage**: `EncryptedStorage` plugin is used for all offline caches containing classify-identifiable info.

## 5. Breach Response & Anomaly Detection
The telemetry layer includes anomaly detection hooks:
- **Frequency Analysis**: Detects high-volume data access patterns that deviate from standard orchid management workflows.
- **Exfiltration Alarms**: Triggers an immediate session revocation and alert if PII is accessed via unauthorized routes.

## 6. Audit Logging & Non-Repudiation
Every action in the regulated layer is appended to an immutable audit trail with actor attribution and sequence numbers.
- **Logs**: See `src/server/lib/audit.ts` for server-side persistence and `src/lib/offline-db.ts` for local staging.

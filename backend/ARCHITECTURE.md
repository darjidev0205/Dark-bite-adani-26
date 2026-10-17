# UPI Shield — Backend Architecture & Fraud Engine Specification

## 1. System Overview

UPI Shield is a production-structured backend designed to evaluate risk signals in incoming UPI payment requests, SMS messages, collect requests, payment URLs, and decoded QR codes *before* a user authorizes a transaction with their UPI PIN.

The backend communicates with a modern React + Vite + TypeScript frontend using strict, versioned REST contracts over HTTPS.

```
┌─────────────────────────────────┐
│     React + Vite Frontend       │
└────────────────┬────────────────┘
                 │ Authorization: Bearer <Firebase_ID_TOKEN>
                 │ HTTPS JSON REST API
                 ▼
┌────────────────────────────────────────────────────────┐
│                   FastAPI Application                  │
│                                                        │
│  [Security Headers & Size Limiter Middleware]          │
│  [Rate Limiter (Token Bucket / Sliding Window)]        │
│  [Firebase Admin Token Verifier (check_revoked=True)]  │
│                                                        │
│  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │  Fraud Detection      │  │ Safe URL Analyzer    │  │
│  │  Engine (Rules v1.0)  │  │ (Anti-SSRF Offline)  │  │
│  └──────────┬────────────┘  └──────────┬───────────┘  │
│             │                          │              │
│             └───────────┬──────────────┘              │
│                         ▼                             │
│             ┌──────────────────────┐                  │
│             │ Privacy-Conscious    │                  │
│             │ Minimized Data Store │                  │
│             └───────────┬──────────┘                  │
└─────────────────────────┼──────────────────────────────┘
                          │ Async Motor (PyMongo)
                          ▼
┌────────────────────────────────────────────────────────┐
│                  MongoDB Atlas                         │
│  - users (indexed by unique firebase_uid)              │
│  - scans (compound index: user_uid + created_at DESC)  │
│  - TTL Auto-Expiry (configurable retention)            │
└────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Identity Flow

1. **Identity Provider**: Firebase Authentication is the sole identity provider. The backend never accepts raw passwords, secret keys, or unverified client-asserted UIDs.
2. **Server-Side Verification**: Every protected route extracts `Authorization: Bearer <token>` and verifies the token using `firebase_admin.auth.verify_id_token(token, check_revoked=True)`.
3. **User Isolation**: All database queries (`find`, `count`, `update`, `delete`) strictly enforce `{"user_uid": current_user["uid"]}`. Cross-user document access returns HTTP 404 to avoid revealing document existence.
4. **Credential Security**: Firebase service account JSON files or workload identities are loaded through environment variables (`FIREBASE_CREDENTIALS_PATH` or `GOOGLE_APPLICATION_CREDENTIALS`) and are never exposed in API payloads, error messages, or logs.

---

## 3. Privacy & Data Minimization Architecture

In compliance with financial data privacy standards, UPI Shield implements strict data minimization:
- **No Raw Input Persistence**: Raw payment messages, full submitted URLs with auth parameters, bank account numbers, passwords, PINs, and OTPs are **never stored** in the database.
- **Sanitized Summaries**: Only high-level sanitized summaries (e.g., `type=message; len=54; indicators=[pin_term,reward_term]`) are retained for user history.
- **Log Redaction**: The custom `PrivacyLogFormatter` automatically scrubs:
  - Bearer tokens and JWTs
  - 4-digit and 6-digit UPI PINs
  - OTP numbers and verification codes
  - Credit and debit card numbers (16-digit PANs)
  - Bank account numbers

---

## 4. Deterministic Fraud Engine (Version 1.0.0)

UPI Shield intentionally relies on an **explainable, deterministic rule engine** rather than unverified black-box ML claims.

### Rule Weights

| Indicator | Code | Weight | Severity |
| :--- | :--- | :---: | :---: |
| Requesting UPI PIN to receive money / refund | `PIN_REQUEST_RECEIVE` | **+50** | High (Safety-Critical) |
| Demanding OTP, password, or security code | `CREDENTIAL_OR_OTP_DEMAND` | **+50** | High (Safety-Critical) |
| Deceptive or spoofed URL hostname | `BRAND_IMPERSONATION` / `DECEPTIVE_URL` | **+30** | High / Medium |
| Urgent threats (account block, power cut, KYC expiry) | `URGENCY_COERCION` | **+20** | Medium |
| Unverified or misleading recipient name | `SUSPICIOUS_RECIPIENT_KEYWORDS` | **+15** | Medium |
| Generic unverified merchant query | `UNVERIFIED_RECIPIENT` | **+15** | Low |
| Unsolicited lottery, cashback, or reward bait | `REWARD_REFUND_BAIT` | **+15** | Medium |

### Risk Thresholds & Score Calculation

$$\text{Final Score} = \min\left(\sum \text{Weights of Triggered Unique Rules}, 100\right)$$

- **0 – 19**: **Low Risk** — Standard precautions apply; double-check payee on bank screen.
- **20 – 49**: **Medium Risk** — Caution advised; verify whether request is debit or credit.
- **50 – 100**: **High Risk** — Critical threat detected; do not approve request or input PIN.

### Safety-Critical Override
A request to enter a UPI PIN to receive funds or share an OTP is an unambiguous scam indicator under NPCI guidelines. If detected, the engine sets `risk_level = "high"` and ensures a minimum score of 50 regardless of other factors.

---

## 5. URL & QR Code Analysis (SSRF-Safe)

### Offline Static Inspection
The `SafeURLAnalyzer` performs **offline heuristic parsing** without initiating outbound network requests:
1. **SSRF Prevention**: Inspects host for private, localhost, or link-local IP addresses (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254` AWS metadata).
2. **Raw Public IPs**: Rejects direct IP literals in lieu of valid domain names.
3. **Scheme Validation**: Flags unencrypted `http://` for payments and blocks dangerous pseudo-schemes (`javascript:`, `data:`, `file:`).
4. **Brand Impersonation**: Checks known bank and UPI brands (`gpay`, `paytm`, `phonepe`, `sbi`, etc.) against authorized root domains.
5. **High-Risk TLDs & Executables**: Flags suspicious TLDs (`.xyz`, `.top`, `.click`) and direct downloads of Android executables (`.apk`).
6. **Reputation Transparency**: Explicitly indicates that outbound reputation calls were not made, protecting user privacy and preventing SSRF.

---

## 6. Limitations & Regulatory Disclaimer

- **Heuristic Warnings, Not Fraud Adjudication**: UPI Shield scores represent detected warning signals based on common attack patterns. They are not legal determinations of fraud.
- **No Outbound Payment Control**: UPI Shield inspects request text and data; it never intercepts banking transactions or initiates financial operations.
- **Social Engineering Evolution**: Fraudsters continuously iterate on phrasing. Users must always verify the payee name on their NPCI banking screen before entering their UPI PIN.

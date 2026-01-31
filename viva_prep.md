# Security Implementation Breakdown (Viva Preparation)

This document maps the project features to standard cybersecurity concepts for your technical defense.

## 1. CIA Triad Mapping

| Component | Description | CIA Pillar | Implementation |
| :--- | :--- | :--- | :--- |
| **Encryption** | Sensitive fields (like phone numbers) are encrypted at rest using AES-256-CBC. | **Confidentiality** | `encrypt.js` |
| **Hashing & Signatures** | Donation data is signed using RSA/SHA-256 to prevent tampering. | **Integrity** | `signature.js`, `donation.js` |
| **Authentication/MFA** | Multi-Factor Authentication ensures that even with a stolen password, an attacker cannot access the account. | **Confidentiality / Integrity** | `auth.js` |
| **RBAC (ACL)** | Strict access controls for Admin, Staff, and Users. | **Availability / Integrity** | `acl.js` |

## 2. Algorithms Used

### Encryption: AES-256-CBC (Symmetric)
- **Why?** It is the industry standard for securing data at rest. 256-bit keys offer high security against brute-force attacks.
- **Location:** `backend/crypto/encrypt.js`

### Hashing: SHA-256 (One-Way)
- **Why?** Used in Digital Signatures. A small change in data results in a completely different hash (Avalanche Effect), making data tampering detectable.
- **Location:** `backend/crypto/signature.js`

### Password Hashing: Bcrypt
- **Why?** Uses "salting" to prevent Rainbow Table attacks and "iteration" to make brute-forcing slow.
- **Location:** `backend/routes/auth.js`

## 3. Encoding vs Encryption

| Feature | Encoding (Base64/URL) | Encryption (AES-256) |
| :--- | :--- | :--- |
| **Goal** | Data compatibility/transmission. | Data security/privacy. |
| **Key Required?** | No. | Yes. |
| **Reversibility** | Easily reversible by anyone. | Requires a private/secret key. |
| **Example in Code** | Used for JWT payloads and URL parameters. | Used for PII (Personally Identifiable Information). |

## 4. Access Control List (ACL / RBAC)

The system uses a **Middleware-based RBAC approach**:
1. **Coarse-grained:** Checks if the user's role (Admin, Staff, Donor) is in the allowed list for the route.
2. **Fine-grained:** Maps specific actions (e.g., `delete_donation`) to permissions as defined in `PERMISSIONS` object in `acl.js`.

# Project Security Implementation Rubric

This document explicitly maps the requirements to the implementation in this project.

## CORE SECURITY REQUIREMENTS

### 1. Access Control (RBAC)
- **Requirement:** Robust ACL with distinct permissions for Staff, User, and Admin.
- **Implementation:** `backend/middleware/acl.js`. 
- **Status:** ✅ VERIFIED. Returns "Access Denied: [Role] Only" on unauthorized attempts.
- **Mapping:** 
  - Admin: All permissions.
  - Staff: Read, Create Expense Proofs.
  - Donor (User): Read own, Create Donation.

### 2. Multi-Factor Authentication (MFA)
- **Requirement:** Mock MFA flow.
- **Implementation:** `backend/routes/auth.js`.
- **Status:** ✅ VERIFIED. Logic follows Password Verif → OTP Generation → OTP Verif → JWT Issuance.
- **Mapping:** Simulated via console logging to avoid external dependencies (e.g., Twilio/Nodemailer).

### 3. Encryption/Decryption (Confidentiality)
- **Requirement:** Secure handling of sensitive data at rest.
- **Implementation:** `backend/crypto/encrypt.js`.
- **Status:** ✅ VERIFIED. Uses **AES-256-CBC**.
- **Mapping:** Donor phone numbers are encrypted before being saved to MongoDB.

### 4. Digital Signatures (Integrity)
- **Requirement:** Ensure data integrity for specific transactions.
- **Implementation:** `backend/crypto/signature.js`.
- **Status:** ✅ VERIFIED. Uses **RSA with SHA-256**.
- **Mapping:** A digital signature is generated for every donation and saved as `dataHash`.

### 5. Encoding
- **Requirement:** Proper use of encoding for data transmission.
- **Implementation:** `backend/crypto/encoding.js` and `auth.js`.
- **Status:** ✅ VERIFIED. Uses **Base64** for context and JWT payloads.

---

## CIA TRIAD SUMMARY

1. **CONFIDENTIALITY:** Handled by AES-256 (PII data) and Bcrypt (Passwords).
2. **INTEGRITY:** Handled by RSA-SHA256 (Transaction data) and Salted Hashing.
3. **AVAILABILITY:** Handled by modular code architecture and RESTful principles.

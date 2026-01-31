# Laboratory Evaluation - Code Mapping
This document maps the security requirements from the rubric to the specific code implementations in this project.

## 1. Authentication (3m)
### Single-Factor Authentication
- **Implemented Code**: `backend/routes/auth.js`
- **Location**: Login Logic (Step 1)
- **Detail**: Checking password hash using `bcrypt.compare`.
- **Link**: [backend/routes/auth.js](backend/routes/auth.js)

### Multi-Factor Authentication (MFA)
- **Implemented Code**: `backend/routes/auth.js`
- **Location**: Step 1 (OTP Generation) & Step 2 (OTP Verification)
- **Detail**: Login now requires two steps. 
    1. `/login` verifies password and sends OTP.
    2. `/verify-otp` verifies OTP and issues JWT.
- **Link**: [backend/routes/auth.js](backend/routes/auth.js) (Search for `OTP Generation`)

## 2. Authorization - Access Control (3m)
### Access Control Model
- **Implemented Code**: `backend/middleware/acl.js`
- **Location**: `PERMISSIONS` object & `checkPermission` middleware.
- **Detail**: Defines 3 Subjects (`admin`, `donor`, `staff`) and 3 Objects (`donation`, `profile`, `expense_proof`).
- **Link**: [backend/middleware/acl.js](backend/middleware/acl.js)

### Policy Definition & Justification
- **Implemented Code**: `backend/middleware/acl.js`
- **Detail**: The `PERMISSIONS` constant explicitly defines who can do what (e.g., Staff can READ donations but not CREATE them).

### Implementation of Access Control
- **Implemented Code**: `backend/routes/donation.js`
- **Detail**: Routes use the `acl()` middleware to enforce permissions.
- **Example**: `router.post("/create", auth, acl(["donor", "admin"], "donation", "create") ...)`
- **Link**: [backend/routes/donation.js](backend/routes/donation.js)

## 3. Encryption (3m)
### Key Exchange Mechanism
- **Implemented Code**: `backend/routes/auth.js` & `backend/crypto/signature.js`
- **Location**: `GET /public-key` endpoint.
- **Detail**: Exposes the RSA Public Key for clients to encrypt data before sending (conceptually).
- **Link**: [backend/routes/auth.js](backend/routes/auth.js) (Search for `/public-key`)

### Encryption & Decryption
- **Implemented Code**: `backend/crypto/encrypt.js`
- **Detail**: Uses AES-256-CBC for symmetric encryption of sensitive data (e.g., Donor Phone Number).
- **Link**: [backend/crypto/encrypt.js](backend/crypto/encrypt.js)

## 4. Hashing & Digital Signature (3m)
### Hashing with Salt
- **Implemented Code**: `backend/routes/auth.js`
- **Detail**: Using `bcryptjs` for password hashing during signup/login.
- **Link**: [backend/routes/auth.js](backend/routes/auth.js)

### Digital Signature using Hash
- **Implemented Code**: `backend/crypto/signature.js` & `backend/routes/donation.js`
- **Detail**: Signs donation data path using RSA-SHA256 digital signature to ensure data integrity.
- **Link**: [backend/crypto/signature.js](backend/crypto/signature.js)
- **Link**: [backend/routes/donation.js](backend/routes/donation.js)

## 5. Encoding Techniques (3m)
### Encoding & Decoding Implementation (Base64)
- **Implemented Code**: `backend/crypto/encoding.js`
- **Detail**: Simple functions to Encode/Decode strings to Base64.
- **Link**: [backend/crypto/encoding.js](backend/crypto/encoding.js)

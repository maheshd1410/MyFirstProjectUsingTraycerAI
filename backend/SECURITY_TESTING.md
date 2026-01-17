# Security Enhancements Testing Guide

This document provides instructions for testing the security enhancements implemented in the API.

## 1. CSRF Protection Testing

### Get CSRF Token
```bash
# Get a CSRF token
curl -X GET http://localhost:3000/api/auth/csrf-token \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "csrfToken": "your-csrf-token-here"
}
```

### Test Protected Endpoint (Without Token)
```bash
# Try to register without CSRF token (should fail)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "fullName": "Test User",
    "phoneNumber": "1234567890"
  }'
```

Expected: `403 Forbidden` or CSRF error

### Test Protected Endpoint (With Token)
```bash
# Register with CSRF token (should succeed)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "fullName": "Test User",
    "phoneNumber": "1234567890"
  }'
```

## 2. Password Validation Testing

### Test Weak Passwords (Should Fail)
```bash
# Password without uppercase
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{
    "email": "test1@example.com",
    "password": "test@123",
    "fullName": "Test User",
    "phoneNumber": "1234567890"
  }'
```

Other weak password examples to test:
- `password` - No uppercase, no number, no special char
- `Password` - No number, no special char
- `Password123` - No special char
- `Pass@1` - Too short (less than 8 characters)

### Test Strong Password (Should Pass)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{
    "email": "test2@example.com",
    "password": "StrongP@ss123",
    "fullName": "Test User",
    "phoneNumber": "1234567890"
  }'
```

Requirements:
- ✅ Minimum 8 characters
- ✅ Maximum 128 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character (@$!%*?&)

## 3. Account Lockout Testing

### Test Failed Login Attempts
```bash
# Attempt 1 - Wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword@123"
  }'
```

Repeat 5 times with wrong password. After the 5th attempt, the account will be locked for 15 minutes.

Expected response after 5 failed attempts:
```json
{
  "error": "Account locked due to multiple failed login attempts. Please try again in X minutes."
}
```

### Test Lockout Duration
Try to login with correct password immediately after lockout:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

Expected: Account still locked with remaining time message

### Test Successful Login After Lockout
Wait 15 minutes or update the database to clear the lockout, then login with correct credentials.

## 4. Input Sanitization Testing

### Test NoSQL Injection Protection
```bash
# Try to inject NoSQL operators
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{
    "email": {"$ne": null},
    "password": {"$ne": null}
  }'
```

Expected: Request sanitized ($ and . replaced with _), should not bypass authentication

### Test XSS Protection
```bash
# Try to inject XSS payload
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{
    "fullName": "<script>alert(\"XSS\")</script>Test User"
  }'
```

Expected: Script tags escaped/removed in stored data

## 5. File Upload Testing

### Test Valid Image Upload
```bash
# Upload a valid .jpg image (under 5MB)
curl -X POST http://localhost:3000/api/profile/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -F "image=@/path/to/valid-image.jpg"
```

Expected: Success response with image URL

### Test Invalid File Extension
```bash
# Try to upload .exe file
curl -X POST http://localhost:3000/api/profile/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -F "image=@/path/to/file.exe"
```

Expected: `400 Bad Request` - Invalid file type

### Test File Size Limit
```bash
# Try to upload file larger than 5MB
curl -X POST http://localhost:3000/api/profile/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -F "image=@/path/to/large-file.jpg"
```

Expected: `413 Payload Too Large` or file size error

### Test Multiple Files Limit
```bash
# Try to upload more than 5 files
curl -X POST http://localhost:3000/api/products/upload-images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg" \
  -F "images=@image4.jpg" \
  -F "images=@image5.jpg" \
  -F "images=@image6.jpg"
```

Expected: Only first 5 files accepted or error

## 6. Security Headers Testing

### Check Response Headers
```bash
curl -I http://localhost:3000/api/products
```

Expected headers:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: ...`

### Test Request Size Limit
```bash
# Try to send request body larger than 10MB
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d "$(python -c 'print("x" * 11000000)')"
```

Expected: `413 Payload Too Large`

## Testing with Postman

1. **Import Collection**: Create a Postman collection with all the above requests
2. **Environment Variables**: Set up environment variables for:
   - `BASE_URL`: http://localhost:3000
   - `CSRF_TOKEN`: Get from CSRF token endpoint
   - `JWT_TOKEN`: Get from successful login
3. **Pre-request Script**: Add script to get CSRF token automatically:
   ```javascript
   pm.sendRequest({
     url: pm.environment.get('BASE_URL') + '/api/auth/csrf-token',
     method: 'GET'
   }, function (err, res) {
     pm.environment.set('CSRF_TOKEN', res.json().csrfToken);
   });
   ```

## Automated Testing

Run the test suite:
```bash
cd backend
npm test
```

Run specific security tests:
```bash
npm test -- auth.service.test.ts  # Tests account lockout logic
npm test -- auth.test.ts          # Tests authentication with CSRF
```

## Notes

- **CSRF Token Validity**: Tokens are session-based and stored in cookies
- **Lockout Reset**: After 15 minutes, failed login attempts reset automatically
- **Password Requirements**: Enforced at validation layer (cannot be bypassed)
- **Upload Restrictions**: Both extension and MIME type are validated
- **Sanitization**: Automatic for all request bodies

## Production Checklist

- [ ] Change `CSRF_SECRET` to a cryptographically secure random string (min 32 chars)
- [ ] Update `JWT_SECRET` and `JWT_REFRESH_SECRET` 
- [ ] Enable HTTPS in production for secure cookie transmission
- [ ] Configure proper `FRONTEND_URL` for CORS
- [ ] Set `NODE_ENV=production`
- [ ] Review and adjust rate limiting settings
- [ ] Monitor failed login attempts in production logs
- [ ] Set up alerts for security events

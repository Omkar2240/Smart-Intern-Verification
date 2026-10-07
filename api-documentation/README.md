# Admin Panel API Documentation

## Overview

This directory contains comprehensive API documentation for the Smart Intern Verification Admin Panel. The API is designed with role-based access control (RBAC) to ensure that each admin role has appropriate permissions based on their scope of responsibility.

## Base URL

```
https://trackintern-backend.onrender.com/api/v1
```

For local development:
```
http://localhost:8000/api/v1
```

## Documentation Structure

The API documentation is organized into the following files:

### 1. [Common API Documentation](./COMMON_API.md)
**Accessible to all admin roles**

Contains APIs that are shared across all admin roles:
- Authentication (login, logout, refresh token)
- User profile management
- Verification management (view, approve, reject, reset biometrics)
- Internship management (view, update status)
- Analytics (role-based summaries)
- Attendance monitoring (view and analytics)

**Who can access:** `super_admin`, `admin`, `college_admin`, `department_admin`

---

### 2. [Super Admin API Documentation](./SUPER_ADMIN_API.md)
**Platform-wide access**

Contains APIs for managing the entire platform:
- College management (create, update, list, roster upload)
- Department management (create, update, list)
- Admin user management (create college admins, department admins)
- Student management (view all students platform-wide)
- Verification management (full access to all verifications)
- Internship management (full access to all internships)
- Analytics (platform-wide KPIs)
- Audit logs (security monitoring)
- System configuration (platform settings)

**Who can access:** `super_admin`, `admin`

**Access Scope:** All colleges, departments, and users platform-wide

---

### 3. [College Admin API Documentation](./COLLEGE_ADMIN_API.md)
**College-level access**

Contains APIs for managing a single college:
- Department management (create, update, list within college)
- Department admin management (create, toggle status)
- Student management (view students in the college)
- Verification management (view and manage verifications in the college)
- Internship management (view and manage internships in the college)
- Analytics (college-level KPIs)
- Attendance monitoring (view and analytics for the college)

**Who can access:** `college_admin`

**Access Scope:** Single college (assigned via `college_id`)

---

### 4. [Department Admin API Documentation](./DEPARTMENT_ADMIN_API.md)
**Department-level access**

Contains APIs for managing a single department:
- Student management (view students in the department)
- Verification management (view and manage verifications in the department)
- Internship management (view and manage internships in the department)
- Attendance monitoring (view and analytics for the department)
- Analytics (department-level KPIs)

**Who can access:** `department_admin`

**Access Scope:** Single department (assigned via `department_id`)

---

## Role Hierarchy

```
super_admin / admin (Platform-wide)
    ↓
college_admin (College-level)
    ↓
department_admin (Department-level)
```

### Role Permissions Summary

| Feature | Super Admin | College Admin | Department Admin |
|---------|-------------|---------------|-------------------|
| View all colleges | ✅ | ❌ | ❌ |
| Create/edit colleges | ✅ | ❌ | ❌ |
| View all departments | ✅ | ✅ (own college) | ❌ |
| Create/edit departments | ✅ | ✅ (own college) | ❌ |
| Manage college admins | ✅ | ❌ | ❌ |
| Manage department admins | ✅ | ✅ (own college) | ❌ |
| View all students | ✅ | ✅ (own college) | ✅ (own dept) |
| Manage verifications | ✅ (all) | ✅ (college) | ✅ (dept) |
| Manage internships | ✅ (all) | ✅ (college) | ✅ (dept) |
| View analytics | ✅ (platform) | ✅ (college) | ✅ (dept) |
| View attendance | ✅ (all) | ✅ (college) | ✅ (dept) |
| Audit logs | ✅ | ❌ | ❌ |
| System config | ✅ | ❌ | ❌ |

---

## Authentication

All API endpoints (except login) require authentication using a Bearer token.

### Login Flow

1. **Login Request**
   ```http
   POST /api/v1/auth/login
   Content-Type: application/json

   {
     "email": "admin@example.com",
     "password": "secure_password"
   }
   ```

2. **Login Response**
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "uuid",
       "email": "admin@example.com",
       "name": "Admin Name",
       "role": "college_admin",
       "college_id": "uuid",
       "department_id": "uuid"
     }
   }
   ```

3. **Authenticated Request**
   ```http
   GET /api/v1/admin/verifications
   Authorization: Bearer {access_token}
   ```

### Token Management

- **Access Token Expiration:** 24 hours
- **Refresh Token Expiration:** 30 days
- **Refresh Token:** Use `POST /api/v1/auth/refresh` to get a new access token
- **Logout:** Use `POST /api/v1/auth/logout` to invalidate the session

---

## Common Request/Response Patterns

### Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "total": 1000,
  "page": 1,
  "page_size": 20,
  "items": [...]
}
```

### Filtering

Most list endpoints support filtering via query parameters:

```http
GET /api/v1/admin/verifications?status=manual_review&search=rahul&page=1&page_size=20
```

### Error Responses

All endpoints return standardized error responses:

**401 Unauthorized**
```json
{
  "detail": "Could not validate credentials"
}
```

**403 Forbidden**
```json
{
  "detail": "You do not have permission to perform this action"
}
```

**404 Not Found**
```json
{
  "detail": "Resource not found"
}
```

**422 Validation Error**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**500 Internal Server Error**
```json
{
  "detail": "Internal server error"
}
```

---

## Data Models

### User Model
```typescript
{
  id: string;           // UUID
  email: string;
  name: string;
  role: "super_admin" | "admin" | "college_admin" | "department_admin";
  college_id?: string;  // UUID (for college_admin and department_admin)
  department_id?: string; // UUID (for department_admin)
  is_active: boolean;
  created_at: string;   // ISO 8601 datetime
  last_login?: string;  // ISO 8601 datetime
}
```

### Verification Status
- `not_started`: Student has not started verification
- `pending`: Verification in progress
- `manual_review`: Requires manual admin review
- `verified`: Successfully verified
- `rejected`: Verification rejected

### Internship Verification Stages
- `submitted`: Student submitted internship details
- `tp_review`: Training & Placement cell review
- `mentor_review`: Mentor/faculty review
- `verified`: Successfully verified
- `rejected`: Verification rejected

### Internship Status
- `pending`: Pending verification
- `verified`: Successfully verified
- `rejected`: Verification rejected

### Internship Types
- `on_site`: On-site internship
- `remote`: Remote internship
- `hybrid`: Hybrid internship

---

## Rate Limiting

To prevent API abuse, all endpoints are rate-limited:

- **Standard rate limit:** 100 requests per minute per user
- **Burst rate limit:** 200 requests per minute per user

If you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

---

## File Uploads

For endpoints that accept file uploads, use `multipart/form-data`:

```http
POST /api/v1/admin/colleges/{college_id}/roster/upload
Content-Type: multipart/form-data
Authorization: Bearer {access_token}

file: [binary data]
```

**Supported file types:**
- Images: JPEG, PNG, WebP
- Documents: PDF

**Maximum file size:** 10 MB

---

## Quick Start Guide

### For Super Admin

1. Login to get your access token
2. View platform analytics: `GET /api/v1/admin/analytics/summary`
3. List all colleges: `GET /api/v1/colleges`
4. Create a new college: `POST /api/v1/admin/colleges`
5. Upload student roster: `POST /api/v1/admin/colleges/{college_id}/roster/upload`
6. Create college admin: `POST /api/v1/admin/admins`
7. View verification queue: `GET /api/v1/admin/verifications`
8. Approve/reject verifications: `POST /api/v1/admin/verifications/{user_id}/approve` or `reject`

### For College Admin

1. Login to get your access token
2. View college analytics: `GET /api/v1/admin/analytics/summary`
3. List departments: `GET /api/v1/departments`
4. Create a new department: `POST /api/v1/admin/departments`
5. Create department admin: `POST /api/v1/admin/admins`
6. View college verifications: `GET /api/v1/admin/verifications`
7. View college internships: `GET /api/v1/admin/internships`
8. View attendance: `GET /api/v1/admin/attendance`

### For Department Admin

1. Login to get your access token
2. View department analytics: `GET /api/v1/admin/analytics/summary`
3. View department students: `GET /api/v1/admin/students`
4. View department verifications: `GET /api/v1/admin/verifications`
5. Approve/reject verifications: `POST /api/v1/admin/verifications/{user_id}/approve` or `reject`
6. View department internships: `GET /api/v1/admin/internships`
7. Update internship status: `PATCH /api/v1/admin/internships/{internship_id}/status`
8. View attendance: `GET /api/v1/admin/attendance`

---

## Admin Portal Pages and API Mapping

| Admin Portal Page | Primary API Endpoints | Role Access |
|-------------------|----------------------|-------------|
| Dashboard | `GET /api/v1/admin/analytics/summary` | All roles |
| Verifications | `GET /api/v1/admin/verifications`<br>`POST /api/v1/admin/verifications/{user_id}/approve`<br>`POST /api/v1/admin/verifications/{user_id}/reject` | All roles |
| Internships | `GET /api/v1/admin/internships`<br>`PATCH /api/v1/admin/internships/{internship_id}/status` | All roles |
| Colleges | `GET /api/v1/colleges`<br>`POST /api/v1/admin/colleges`<br>`PUT /api/v1/admin/colleges/{college_id}` | Super Admin only |
| Departments | `GET /api/v1/departments`<br>`POST /api/v1/admin/departments`<br>`PUT /api/v1/admin/departments/{department_id}` | Super Admin, College Admin |
| Admin Users | `GET /api/v1/admin/admins`<br>`POST /api/v1/admin/admins`<br>`PATCH /api/v1/admin/admins/{admin_id}/status` | Super Admin, College Admin |
| Students | `GET /api/v1/admin/students` | All roles |
| Attendance | `GET /api/v1/admin/attendance`<br>`GET /api/v1/admin/attendance/analytics` | All roles |
| Audit Logs | `GET /api/v1/admin/audit-logs` | Super Admin only |
| System Config | `GET /api/v1/admin/system-config`<br>`PUT /api/v1/admin/system-config` | Super Admin only |

---

## Security Best Practices

1. **Never expose access tokens** in client-side code or URLs
2. **Use HTTPS** for all API calls in production
3. **Validate all user inputs** before sending to the API
4. **Handle errors gracefully** and never expose sensitive error details to users
5. **Implement proper logout** to invalidate tokens
6. **Use refresh tokens** instead of storing long-lived access tokens
7. **Rate limit your API calls** to avoid hitting the rate limit
8. **Sanitize and validate** all file uploads before processing

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST https://trackintern-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure_password"}'

# Get verifications
curl -X GET https://trackintern-backend.onrender.com/api/v1/admin/verifications \
  -H "Authorization: Bearer {access_token}"

# Approve verification
curl -X POST https://trackintern-backend.onrender.com/api/v1/admin/verifications/{user_id}/approve \
  -H "Authorization: Bearer {access_token}"
```

### Using Postman

1. Import the API collection (if available)
2. Set the base URL: `https://trackintern-backend.onrender.com/api/v1`
3. Create an environment variable for `access_token`
4. Use the login endpoint to get the token
5. Set the `Authorization` header to `Bearer {{access_token}}`
6. Test other endpoints

---

## Support

For API-related issues or questions:
- **Email:** support@trackintern.com
- **Documentation:** See individual API documentation files
- **Issues:** Report bugs via the project's issue tracker

---

## Changelog

### Version 1.0.0 (Current)
- Initial API documentation
- Role-based access control (RBAC)
- Authentication and authorization
- Verification management
- Internship management
- College and department management
- Admin user management
- Analytics and reporting
- Attendance monitoring
- Audit logging
- System configuration

---

## License

This API documentation is part of the Smart Intern Verification platform. All rights reserved.

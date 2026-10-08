# Common API Documentation

## Overview
This document contains APIs that are accessible to all admin roles (Super Admin, College Admin, and Department Admin). These APIs provide common functionality like authentication, user profile management, and analytics.

**Access Level:** `super_admin`, `admin`, `college_admin`, `department_admin`

## Implementation Status

All **17 documented common endpoints** are implemented in the backend (**17 created, 0 remaining**).

- Authentication: 3/3
- User profile: 3/3
- Verification management: 5/5
- Internship management: 3/3
- Analytics: 1/1
- Attendance monitoring: 2/2

The admin attendance endpoints are isolated in `backend/app/api/v1/admin/attendance.py`.

---

## Authentication

### POST /api/v1/auth/login
Login to the admin portal.

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "college_admin",
    "college_id": "uuid",
    "college_name": "IIT Bombay",
    "department_id": "uuid",
    "department_name": "Computer Science & Engineering"
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `422`: Validation error (missing fields)

---

### POST /api/v1/auth/logout
Logout from the admin portal.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/v1/auth/refresh
Refresh the access token using a refresh token.

**Access:** All admin roles (requires refresh token)

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## User Profile

### GET /api/v1/users/me
Get the currently authenticated admin user's profile.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "name": "Admin Name",
  "role": "college_admin",
  "college_id": "uuid",
  "college_name": "IIT Bombay",
  "department_id": "uuid",
  "department_name": "Computer Science & Engineering",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-15T10:30:00Z"
}
```

---

### PATCH /api/v1/users/me
Update the currently authenticated admin user's profile.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated.email@example.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "updated.email@example.com",
  "name": "Updated Name",
  "role": "college_admin",
  "college_id": "uuid",
  "college_name": "IIT Bombay",
  "department_id": "uuid",
  "department_name": "Computer Science & Engineering",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-15T10:30:00Z"
}
```

---

### POST /api/v1/users/me/change-password
Change the authenticated admin user's password.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "current_password": "old_password",
  "new_password": "new_secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400`: Current password is incorrect
- `422`: Validation error (password too weak)

---

## Verification Management (Common)

### GET /api/v1/admin/verifications
List student identity verifications with role-based filtering.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `status` (optional): Filter by status (manual_review, verified, rejected, pending, all)
- `search` (optional): Search by student name, email, or registration number
- `college_id` (optional): Filter by college UUID (Super Admin and College Admin only)
- `department_id` (optional): Filter by department UUID (College Admin and Department Admin only)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 200,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "user_id": "uuid",
      "user_name": "Rahul Kumar",
      "user_email": "rahul.kumar@iitb.edu",
      "registration_number": "2024001",
      "mobile_number": "+919876543210",
      "college_id": "uuid",
      "college_name": "IIT Bombay",
      "college_status": "active",
      "college_id_status": "verified",
      "face_status": "verified",
      "overall_status": "verified",
      "extracted_metadata": {
        "fields": {
          "student_name": "Rahul Kumar",
          "college_name": "IIT Bombay",
          "registration_number": "2024001",
          "department": "Computer Science & Engineering"
        },
        "verification": {
          "confidence_score": 92.5
        }
      },
      "has_card_image": true,
      "has_face_embedding": true,
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00Z",
      "verified_at": "2024-01-02T10:30:00Z"
    }
  ]
}
```

**Role-Based Access:**
- **Super Admin**: Can view all verifications across all colleges
- **College Admin**: Can view verifications for their college only
- **Department Admin**: Can view verifications for their department only

---

### GET /api/v1/admin/verifications/{user_id}/card-image
Get student's uploaded college ID document image.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** Image file (JPEG, PNG, or PDF)

**Role-Based Access:**
- **Super Admin**: Can view any student's document
- **College Admin**: Can view documents for students in their college
- **Department Admin**: Can view documents for students in their department

---

### POST /api/v1/admin/verifications/{user_id}/approve
Manually approve a student's verification.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification approved successfully",
  "overall_status": "verified"
}
```

**Role-Based Access:**
- **Super Admin**: Can approve any student's verification
- **College Admin**: Can approve verifications for students in their college
- **Department Admin**: Can approve verifications for students in their department

---

### POST /api/v1/admin/verifications/{user_id}/reject
Reject a student's verification with reason.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "reason": "College ID document is blurry and cannot be verified"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification rejected",
  "overall_status": "rejected"
}
```

**Role-Based Access:**
- **Super Admin**: Can reject any student's verification
- **College Admin**: Can reject verifications for students in their college
- **Department Admin**: Can reject verifications for students in their department

---

### POST /api/v1/admin/verifications/{user_id}/reset-biometrics
Reset a student's facial biometric enrollment.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Biometrics reset successfully",
  "overall_status": "pending"
}
```

**Role-Based Access:**
- **Super Admin**: Can reset biometrics for any student
- **College Admin**: Can reset biometrics for students in their college
- **Department Admin**: Can reset biometrics for students in their department

---

## Internship Management (Common)

### GET /api/v1/admin/internships
List student internships with role-based filtering.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `stage` (optional): Filter by verification stage (submitted, tp_review, mentor_review, verified, rejected)
- `status` (optional): Filter by status (pending, verified, rejected, all)
- `search` (optional): Search by company, role, or student details
- `college_id` (optional): Filter by college UUID (Super Admin and College Admin only)
- `department_id` (optional): Filter by department UUID (College Admin and Department Admin only)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 617,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "student_name": "Rahul Kumar",
      "student_email": "rahul.kumar@iitb.edu",
      "student_registration_number": "2024001",
      "student_mobile": "+919876543210",
      "college_name": "IIT Bombay",
      "company_name": "Google",
      "role": "Software Engineer Intern",
      "department": "Engineering",
      "internship_type": "remote",
      "location": "Bangalore",
      "supervisor_name": "John Doe",
      "supervisor_email": "john.doe@google.com",
      "supervisor_phone": "+1234567890",
      "start_date": "2024-06-01",
      "end_date": "2024-08-31",
      "stipend": "₹80,000/month",
      "offer_letter_url": "storage_ref",
      "verification_stage": "tp_review",
      "status": "pending",
      "rejection_reason": null,
      "is_active": true,
      "created_at": "2024-05-01T00:00:00Z",
      "updated_at": "2024-05-15T00:00:00Z"
    }
  ]
}
```

**Role-Based Access:**
- **Super Admin**: Can view all internships across all colleges
- **College Admin**: Can view internships for students in their college
- **Department Admin**: Can view internships for students in their department

---

### GET /api/v1/admin/internships/{internship_id}/proof
Get internship offer letter or proof document.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** PDF or Image file

**Role-Based Access:**
- **Super Admin**: Can view any internship document
- **College Admin**: Can view documents for internships in their college
- **Department Admin**: Can view documents for internships in their department

---

### PATCH /api/v1/admin/internships/{internship_id}/status
Update internship verification stage and status.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "verification_stage": "mentor_review",
  "status": "pending",
  "rejection_reason": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Internship status updated successfully"
}
```

**Role-Based Access:**
- **Super Admin**: Can update any internship status
- **College Admin**: Can update internships for students in their college
- **Department Admin**: Can update internships for students in their department

---

## Analytics

### GET /api/v1/admin/analytics/summary
Get analytics summary with role-based filtering.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_users": 2400,
  "verified_users": 2100,
  "pending_reviews": 150,
  "rejected_verifications": 150,
  "active_colleges": 1,
  "total_internships": 617,
  "pending_internships": 85,
  "verified_internships": 532
}
```

**Role-Based Access:**
- **Super Admin**: Platform-wide analytics
- **College Admin**: College-level analytics
- **Department Admin**: Department-level analytics

---

## Attendance Monitoring (Common)

### GET /api/v1/admin/attendance
Get attendance records with role-based filtering.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `department_id` (optional): Filter by department UUID (College Admin and Department Admin only)
- `date` (optional): Filter by date (ISO 8601 format: YYYY-MM-DD)
- `date_filter` (optional): Predefined filter (today, week, month)
- `status` (optional): Filter by status (present, absent, late)
- `search` (optional): Search by student name
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 2400,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "student_name": "Rahul Kumar",
      "department_id": "uuid",
      "department_name": "Computer Science & Engineering",
      "date": "2024-01-15",
      "check_in": "09:15",
      "check_out": "17:30",
      "status": "present",
      "attendance_rate": 85
    }
  ]
}
```

**Role-Based Access:**
- **Super Admin**: Can view attendance across all colleges
- **College Admin**: Can view attendance for their college
- **Department Admin**: Can view attendance for their department

---

### GET /api/v1/admin/attendance/analytics
Get attendance analytics with role-based filtering.

**Access:** All admin roles (requires authentication)

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `department_id` (optional): Filter by department UUID (College Admin and Department Admin only)
- `period` (optional): Time period (week, month, quarter, year)

**Response:**
```json
{
  "average_attendance_rate": 87.5,
  "present_today": 2100,
  "absent_today": 200,
  "late_today": 100,
  "monthly_trend": [
    {
      "month": "2024-01",
      "rate": 85.2
    },
    {
      "month": "2024-02",
      "rate": 87.5
    }
  ],
  "department_breakdown": [
    {
      "department_id": "uuid",
      "department_name": "Computer Science & Engineering",
      "present": 850,
      "absent": 80,
      "late": 45
    }
  ]
}
```

**Role-Based Access:**
- **Super Admin**: Platform-wide attendance analytics
- **College Admin**: College-level attendance analytics
- **Department Admin**: Department-level attendance analytics

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
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

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Pagination

Most list endpoints support pagination. Use the following query parameters:

- `page`: Page number (default: 1)
- `page_size`: Number of items per page (default: 20, max: 100)

**Response includes:**
```json
{
  "total": 1000,
  "page": 1,
  "page_size": 20,
  "items": [...]
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Standard rate limit**: 100 requests per minute per user
- **Burst rate limit**: 200 requests per minute per user

If rate limit is exceeded, you'll receive a `429 Too Many Requests` response:

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

## Authentication Flow

1. **Login**: Call `POST /api/v1/auth/login` with email and password
2. **Receive Token**: Store the `access_token` from the response
3. **Make Authenticated Requests**: Include the token in the `Authorization` header:
   ```
   Authorization: Bearer {access_token}
   ```
4. **Refresh Token**: Use `POST /api/v1/auth/refresh` to get a new access token before it expires
5. **Logout**: Call `POST /api/v1/auth/logout` to invalidate the session

**Token Expiration:**
- Access token: 24 hours
- Refresh token: 30 days

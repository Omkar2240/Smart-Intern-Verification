# Super Admin API Documentation

## Overview
The Super Admin has full platform-wide access to manage colleges, departments, admins, students, verifications, internships, and system analytics.

**Access Level:** `super_admin` or `admin`
**Access Scope:** Platform-wide (all colleges, departments, and users)

### Implementation status

The existing review, internship, college, roster, attendance, and analytics routes
are kept in the existing `/api/v1/admin` router. The following platform-management
routes are implemented in the modular admin router. Department and student
management can be used by a `college_admin` for that admin's college; platform
administration routes remain restricted to `super_admin`/`admin`:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/colleges` | Paginated platform-wide college directory |
| POST/PUT | `/api/v1/admin/colleges` and `/api/v1/admin/colleges/{college_id}` | Create or update a college |
| GET/POST | `/api/v1/admin/departments` | List and create departments |
| PUT | `/api/v1/admin/departments/{department_id}` | Update a department |
| GET/POST | `/api/v1/admin/admins` | List and create scoped administrators |
| PATCH | `/api/v1/admin/admins/{admin_id}/status` | Activate/deactivate an administrator |
| GET/POST | `/api/v1/admin/students` | List or create students (college-scoped for college admins) |
| GET | `/api/v1/admin/audit-logs` | Paginated audit history |
| GET/PUT | `/api/v1/admin/system-config` | List and update platform configuration |

College and department persistence already existed, so the implementation
reuses the existing models and migration (`colleges`, `departments`, and the
user foreign keys) instead of creating duplicate tables or routes. College
codes and department codes are normalized to uppercase and are checked for
duplicates before writes. The new Super Admin college listing supports
pagination, search, and optional inactive records.

No duplicate routes were added for the existing endpoints. New administrator
accounts require a password in the request body; passwords are stored only as
Argon2id hashes and are never returned.

---

## Authentication

### POST /api/v1/auth/login
Login to the admin portal.

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "superadmin@trackintern.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "superadmin@trackintern.com",
    "name": "Super Admin",
    "role": "super_admin",
    "college_id": null,
    "department_id": null
  }
}
```

---

## College Management

### GET /api/v1/colleges
List all active colleges with optional search.

**Access:** `super_admin`, `admin`

**Query Parameters:**
- `search` (optional): Search by college name, city, or code

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "IIT Bombay",
    "code": "IITB",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### GET /api/v1/admin/colleges
List colleges for platform administration.

**Access:** `super_admin`

**Query Parameters:**
- `search` (optional): Search by name, city, state, or code
- `include_inactive` (optional, default `false`): Include deactivated colleges
- `page` (optional, default `1`)
- `page_size` (optional, default `20`, maximum `100`)

**Response:**
```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "name": "IIT Bombay",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "code": "IITB",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/v1/admin/colleges
Create a new college.

**Access:** `super_admin`, `admin`

**Request Body:**
```json
{
  "name": "G. H. Raisoni College of Engineering",
  "code": "GHRCE",
  "city": "Nagpur",
  "state": "Maharashtra",
  "country": "India"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "G. H. Raisoni College of Engineering",
  "code": "GHRCE",
  "city": "Nagpur",
  "state": "Maharashtra",
  "country": "India",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### PUT /api/v1/admin/colleges/{college_id}
Update an existing college.

**Access:** `super_admin`, `admin`

**Request Body:**
```json
{
  "name": "Updated College Name",
  "city": "Updated City",
  "state": "Updated State",
  "is_active": false
}
```

**Response:** Same as POST response

### POST /api/v1/admin/colleges/{college_id}/roster/upload
Bulk import student roster for automated registration number validation.

**Access:** `super_admin`, `admin`

**Request:** `multipart/form-data`
- `file`: CSV file with columns: student_name, registration_number, email, department

**Response:**
```json
{
  "success": true,
  "added_count": 150,
  "skipped_count": 5,
  "message": "Roster imported successfully"
}
```

---

## Department Management

### GET /api/v1/admin/departments
List all departments across all colleges.

**Access:** `super_admin`

**Query Parameters:**
- `college_id` (optional): Filter by college UUID
- `search` (optional): Search by department name or code

**Response:**
```json
[
  {
    "id": "uuid",
    "college_id": "uuid",
    "name": "Computer Science & Engineering",
    "code": "CSE",
    "hod_name": "Dr. Ramesh Sharma",
    "hod_email": "ramesh.sharma@college.edu",
    "is_active": true,
    "student_count": 2400,
    "active_internships": 617
  }
]
```

### POST /api/v1/admin/departments
Create a new department.

**Access:** `super_admin`

**Request Body:**
```json
{
  "college_id": "uuid",
  "name": "Computer Science & Engineering",
  "code": "CSE",
  "hod_name": "Dr. Ramesh Sharma",
  "hod_email": "ramesh.sharma@college.edu"
}
```

**Response:**
```json
{
  "id": "uuid",
  "college_id": "uuid",
  "name": "Computer Science & Engineering",
  "code": "CSE",
  "hod_name": "Dr. Ramesh Sharma",
  "hod_email": "ramesh.sharma@college.edu",
  "is_active": true
}
```

### PUT /api/v1/admin/departments/{department_id}
Update department details.

**Access:** `super_admin`

**Request Body:**
```json
{
  "name": "Updated Department Name",
  "hod_name": "Dr. New HOD",
  "hod_email": "new.hod@college.edu",
  "is_active": false
}
```

---

## Admin User Management

### GET /api/v1/admin/admins
List all admin users (college admins and department admins).

**Access:** `super_admin`, `admin`

**Query Parameters:**
- `role` (optional): Filter by role (college_admin, department_admin)
- `college_id` (optional): Filter by college UUID
- `search` (optional): Search by name or email
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 45,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "name": "Dr. Ramesh Sharma",
      "email": "ramesh.sharma@college.edu",
      "role": "college_admin",
      "college_id": "uuid",
      "college_name": "IIT Bombay",
      "department_id": null,
      "is_active": true,
      "last_login": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/v1/admin/admins
Create a new admin user (college admin or department admin).

**Access:** `super_admin`, `admin`

**Request Body:**
```json
{
  "name": "Dr. Ramesh Sharma",
  "email": "ramesh.sharma@college.edu",
  "role": "college_admin",
  "college_id": "uuid",
  "department_id": null
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Dr. Ramesh Sharma",
  "email": "ramesh.sharma@college.edu",
  "role": "college_admin",
  "college_id": "uuid",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### PATCH /api/v1/admin/admins/{admin_id}/status
Toggle admin active/inactive status.

**Access:** `super_admin`, `admin`

**Request Body:**
```json
{
  "is_active": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin status updated successfully"
}
```

---

## Student Management

### GET /api/v1/admin/students
List all students across the platform.

**Access:** `super_admin`, `admin`

**Query Parameters:**
- `college_id` (optional): Filter by college UUID
- `department_id` (optional): Filter by department UUID
- `verification_status` (optional): Filter by verification status (verified, pending, manual_review, rejected, not_started)
- `internship_status` (optional): Filter by internship status (active, completed, not_started)
- `search` (optional): Search by name, email, or registration number
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 5000,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "name": "Rahul Kumar",
      "email": "rahul.kumar@student.edu",
      "registration_number": "2024001",
      "mobile_number": "+919876543210",
      "college_id": "uuid",
      "college_name": "IIT Bombay",
      "department_id": "uuid",
      "department_name": "Computer Science & Engineering",
      "verification_status": "verified",
      "internship_status": "active",
      "attendance_rate": 85,
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Verification Management

### GET /api/v1/admin/verifications
List all student identity verifications with advanced filtering.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

**Query Parameters:**
- `status` (optional): Filter by status (manual_review, verified, rejected, pending, all)
- `search` (optional): Search by student name, email, or registration number
- `college_id` (optional): Filter by college UUID
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 500,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "user_id": "uuid",
      "user_name": "Rahul Kumar",
      "user_email": "rahul.kumar@student.edu",
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

### GET /api/v1/admin/verifications/{user_id}/card-image
Get student's uploaded college ID document image.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

**Response:** Image file (JPEG, PNG, or PDF)

### POST /api/v1/admin/verifications/{user_id}/approve
Manually approve a student's verification.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

**Response:**
```json
{
  "success": true,
  "message": "Verification approved successfully",
  "overall_status": "verified"
}
```

### POST /api/v1/admin/verifications/{user_id}/reject
Reject a student's verification with reason.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

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

### POST /api/v1/admin/verifications/{user_id}/reset-biometrics
Reset a student's facial biometric enrollment.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

**Response:**
```json
{
  "success": true,
  "message": "Biometrics reset successfully",
  "overall_status": "pending"
}
```

### POST /api/v1/admin/verifications/{user_id}/force-verify
Force overall student verification to verified.

**Access:** `super_admin`, `admin`

**Response:**
```json
{
  "success": true,
  "message": "Student force verified",
  "overall_status": "verified"
}
```

---

## Internship Management

### GET /api/v1/admin/internships
List all student internships for admin review.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

**Query Parameters:**
- `stage` (optional): Filter by verification stage (submitted, tp_review, mentor_review, verified, rejected)
- `status` (optional): Filter by status (pending, verified, rejected, all)
- `search` (optional): Search by company, role, or student details
- `college_id` (optional): Filter by student college UUID
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 1500,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "student_name": "Rahul Kumar",
      "student_email": "rahul.kumar@student.edu",
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

### GET /api/v1/admin/internships/{internship_id}/proof
Get internship offer letter or proof document.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

**Response:** PDF or Image file

### PATCH /api/v1/admin/internships/{internship_id}/status
Update internship verification stage and status.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

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

---

## Analytics

### GET /api/v1/admin/analytics/summary
Get platform-wide analytics summary.

**Access:** `super_admin`, `admin`, `college_admin`, `department_admin`

**Response:**
```json
{
  "total_users": 5000,
  "verified_users": 4200,
  "pending_reviews": 350,
  "rejected_verifications": 450,
  "active_colleges": 25,
  "total_internships": 1800,
  "pending_internships": 250,
  "verified_internships": 1550
}
```

---

## Audit Logs

### GET /api/v1/admin/audit-logs
List all admin audit logs for security monitoring.

**Access:** `super_admin`, `admin`

**Query Parameters:**
- `admin_id` (optional): Filter by admin UUID
- `action` (optional): Filter by action type (approve, reject, create, update, delete)
- `entity_type` (optional): Filter by entity type (verification, internship, college, department, admin)
- `start_date` (optional): Filter by start date (ISO 8601)
- `end_date` (optional): Filter by end date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 1000,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "admin_id": "uuid",
      "admin_name": "Super Admin",
      "admin_email": "superadmin@trackintern.com",
      "action": "approve",
      "entity_type": "verification",
      "entity_id": "uuid",
      "details": {
        "user_id": "uuid",
        "user_name": "Rahul Kumar"
      },
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## System Configuration

### GET /api/v1/admin/system-config
Get system configuration settings.

**Access:** `super_admin`, `admin`

**Response:**
```json
{
  "verification_timeout_days": 7,
  "max_upload_size_mb": 10,
  "allowed_file_types": ["image/jpeg", "image/png", "application/pdf"],
  "enable_ocr": true,
  "enable_face_recognition": true,
  "face_confidence_threshold": 0.85
}
```

### PUT /api/v1/admin/system-config
Update system configuration settings.

**Access:** `super_admin` only

**Request Body:**
```json
{
  "verification_timeout_days": 14,
  "max_upload_size_mb": 15,
  "face_confidence_threshold": 0.90
}
```

**Response:** Same as GET response

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

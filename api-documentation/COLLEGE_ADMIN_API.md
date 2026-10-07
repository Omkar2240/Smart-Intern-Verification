# College Admin API Documentation

## Overview
The College Admin has access to manage departments, department admins, students, verifications, internships, and analytics within their assigned college only.

**Access Level:** `college_admin`
**Access Scope:** Single college (assigned via `college_id`)

---

## Authentication

### POST /api/v1/auth/login
Login to the admin portal.

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "college.admin@iitb.edu",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "college.admin@iitb.edu",
    "name": "Dr. Ramesh Sharma",
    "role": "college_admin",
    "college_id": "uuid",
    "college_name": "IIT Bombay",
    "department_id": null
  }
}
```

---

## Department Management

### GET /api/v1/departments
List all departments in the college.

**Access:** `college_admin`

**Query Parameters:**
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
    "hod_email": "ramesh.sharma@iitb.edu",
    "is_active": true,
    "student_count": 2400,
    "active_internships": 617
  }
]
```

### POST /api/v1/admin/departments
Create a new department within the college.

**Access:** `college_admin`

**Request Body:**
```json
{
  "name": "Data Science & Engineering",
  "code": "DSE",
  "hod_name": "Dr. Priya Patel",
  "hod_email": "priya.patel@iitb.edu"
}
```

**Response:**
```json
{
  "id": "uuid",
  "college_id": "uuid",
  "name": "Data Science & Engineering",
  "code": "DSE",
  "hod_name": "Dr. Priya Patel",
  "hod_email": "priya.patel@iitb.edu",
  "is_active": true
}
```

### PUT /api/v1/admin/departments/{department_id}
Update department details.

**Access:** `college_admin`

**Request Body:**
```json
{
  "name": "Updated Department Name",
  "hod_name": "Dr. New HOD",
  "hod_email": "new.hod@iitb.edu",
  "is_active": false
}
```

---

## Department Admin Management

### GET /api/v1/admin/admins
List all department admins in the college.

**Access:** `college_admin`

**Query Parameters:**
- `role` (optional): Filter by role (department_admin)
- `search` (optional): Search by name or email
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 15,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "name": "Dr. Amit Kumar",
      "email": "amit.kumar@iitb.edu",
      "role": "department_admin",
      "college_id": "uuid",
      "college_name": "IIT Bombay",
      "department_id": "uuid",
      "department_name": "Computer Science & Engineering",
      "is_active": true,
      "last_login": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/v1/admin/admins
Create a new department admin.

**Access:** `college_admin`

**Request Body:**
```json
{
  "name": "Dr. Amit Kumar",
  "email": "amit.kumar@iitb.edu",
  "role": "department_admin",
  "college_id": "uuid",
  "department_id": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Dr. Amit Kumar",
  "email": "amit.kumar@iitb.edu",
  "role": "department_admin",
  "college_id": "uuid",
  "department_id": "uuid",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### PATCH /api/v1/admin/admins/{admin_id}/status
Toggle department admin active/inactive status.

**Access:** `college_admin`

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
List all students in the college.

**Access:** `college_admin`

**Query Parameters:**
- `department_id` (optional): Filter by department UUID
- `verification_status` (optional): Filter by verification status (verified, pending, manual_review, rejected, not_started)
- `internship_status` (optional): Filter by internship status (active, completed, not_started)
- `search` (optional): Search by name, email, or registration number
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
      "name": "Rahul Kumar",
      "email": "rahul.kumar@iitb.edu",
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
List all student identity verifications in the college.

**Access:** `college_admin`

**Query Parameters:**
- `status` (optional): Filter by status (manual_review, verified, rejected, pending, all)
- `search` (optional): Search by student name, email, or registration number
- `department_id` (optional): Filter by department UUID
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

### GET /api/v1/admin/verifications/{user_id}/card-image
Get student's uploaded college ID document image.

**Access:** `college_admin`

**Response:** Image file (JPEG, PNG, or PDF)

### POST /api/v1/admin/verifications/{user_id}/approve
Manually approve a student's verification.

**Access:** `college_admin`

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

**Access:** `college_admin`

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

**Access:** `college_admin`

**Response:**
```json
{
  "success": true,
  "message": "Biometrics reset successfully",
  "overall_status": "pending"
}
```

---

## Internship Management

### GET /api/v1/admin/internships
List all student internships in the college.

**Access:** `college_admin`

**Query Parameters:**
- `stage` (optional): Filter by verification stage (submitted, tp_review, mentor_review, verified, rejected)
- `status` (optional): Filter by status (pending, verified, rejected, all)
- `search` (optional): Search by company, role, or student details
- `department_id` (optional): Filter by department UUID
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

### GET /api/v1/admin/internships/{internship_id}/proof
Get internship offer letter or proof document.

**Access:** `college_admin`

**Response:** PDF or Image file

### PATCH /api/v1/admin/internships/{internship_id}/status
Update internship verification stage and status.

**Access:** `college_admin`

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
Get college-level analytics summary.

**Access:** `college_admin`

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

---

## Attendance Monitoring

### GET /api/v1/admin/attendance
Get attendance records for students in the college.

**Access:** `college_admin`

**Query Parameters:**
- `department_id` (optional): Filter by department UUID
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

### GET /api/v1/admin/attendance/analytics
Get attendance analytics for the college.

**Access:** `college_admin`

**Query Parameters:**
- `department_id` (optional): Filter by department UUID
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

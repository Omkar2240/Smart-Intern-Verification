# Department Admin API Documentation

## Overview
The Department Admin has access to manage students, verifications, internships, and attendance within their assigned department only. They cannot create new departments or manage other admins.

**Access Level:** `department_admin`
**Access Scope:** Single department (assigned via `department_id`)

---

## Authentication

### POST /api/v1/auth/login
Login to the admin portal.

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "dept.admin@iitb.edu",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "dept.admin@iitb.edu",
    "name": "Dr. Amit Kumar",
    "role": "department_admin",
    "college_id": "uuid",
    "college_name": "IIT Bombay",
    "department_id": "uuid",
    "department_name": "Computer Science & Engineering"
  }
}
```

---

## Student Management

### GET /api/v1/admin/students
List all students in the department.

**Access:** `department_admin`

**Query Parameters:**
- `verification_status` (optional): Filter by verification status (verified, pending, manual_review, rejected, not_started)
- `internship_status` (optional): Filter by internship status (active, completed, not_started)
- `search` (optional): Search by name, email, or registration number
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 800,
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
List all student identity verifications in the department.

**Access:** `department_admin`

**Query Parameters:**
- `status` (optional): Filter by status (manual_review, verified, rejected, pending, all)
- `search` (optional): Search by student name, email, or registration number
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 75,
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

**Access:** `department_admin`

**Response:** Image file (JPEG, PNG, or PDF)

### POST /api/v1/admin/verifications/{user_id}/approve
Manually approve a student's verification.

**Access:** `department_admin`

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

**Access:** `department_admin`

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

**Access:** `department_admin`

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
List all student internships in the department.

**Access:** `department_admin`

**Query Parameters:**
- `stage` (optional): Filter by verification stage (submitted, tp_review, mentor_review, verified, rejected)
- `status` (optional): Filter by status (pending, verified, rejected, all)
- `search` (optional): Search by company, role, or student details
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 250,
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

**Access:** `department_admin`

**Response:** PDF or Image file

### PATCH /api/v1/admin/internships/{internship_id}/status
Update internship verification stage and status.

**Access:** `department_admin`

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

## Attendance Monitoring

### GET /api/v1/admin/attendance
Get attendance records for students in the department.

**Access:** `department_admin`

**Query Parameters:**
- `date` (optional): Filter by date (ISO 8601 format: YYYY-MM-DD)
- `date_filter` (optional): Predefined filter (today, week, month)
- `status` (optional): Filter by status (present, absent, late)
- `search` (optional): Search by student name
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20, max: 100)

**Response:**
```json
{
  "total": 800,
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
Get attendance analytics for the department.

**Access:** `department_admin`

**Query Parameters:**
- `period` (optional): Time period (week, month, quarter, year)

**Response:**
```json
{
  "average_attendance_rate": 88.2,
  "present_today": 720,
  "absent_today": 60,
  "late_today": 20,
  "monthly_trend": [
    {
      "month": "2024-01",
      "rate": 86.5
    },
    {
      "month": "2024-02",
      "rate": 88.2
    }
  ]
}
```

---

## Analytics

### GET /api/v1/admin/analytics/summary
Get department-level analytics summary.

**Access:** `department_admin`

**Response:**
```json
{
  "total_users": 800,
  "verified_users": 750,
  "pending_reviews": 30,
  "rejected_verifications": 20,
  "active_colleges": 1,
  "total_internships": 250,
  "pending_internships": 35,
  "verified_internships": 215
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

# Smart Internship Verification System

An enterprise-grade, multi-tier internship attendance and identity verification platform combining biometrics (ArcFace embeddings, YuNet face detection), document OCR (automated student ID validation), geofencing verification, and role-based administration.

---

## Architecture Overview

```mermaid
graph TD
    A[Mobile App (Expo / React Native)] -->|REST API + JWT| B[FastAPI Backend]
    W[Admin Web Portal (Next.js / React)] -->|REST API + Admin JWT| B
    B --> C[(PostgreSQL Database)]
    B --> D[Biometric Engine (YuNet + ArcFace)]
    B --> E[Document OCR Engine (Tesseract)]
    B --> F[Object Storage / Secure S3]
```

The system consists of three primary modules:
1. **FastAPI Backend (`/backend`)**: High-performance asynchronous API, SQLAlchemy 2.0 ORM, Alembic migrations, biometrics engine, OCR processing, and access control.
2. **Mobile Application (`/mobile-app`)**: Student mobile client with mandatory 3-step onboarding verification, geofenced check-in, face verification, and student dashboard.
3. **Admin Web Portal (`/admin-portal` - Planned)**: Comprehensive administrative oversight console for verification queues, college management, attendance audits, and anomaly monitoring.

---

# Admin System Implementation Plan

This section provides the end-to-end technical blueprint for building and integrating the **Admin Portal and Management System**.

## 1. Objectives & Key Requirements

1. **Identity Verification Queue**: Streamline manual review of student college ID cards flagged by the automated OCR system (`manual_review` or `rejected`).
2. **Biometric Governance**: Audit enrolled face embeddings, handle re-enrollment requests, and monitor attendance facial matching thresholds without storing raw photos.
3. **Institution & Whitelist Directory**: Manage accredited colleges, student enrollment whitelists (roll numbers/emails), and automated OCR matching patterns.
4. **Internship & Company Management**: Administer partner companies, geofence coordinates (lat/long/radius), and student placement attachments.
5. **Real-time Attendance & Anti-Spoofing Audits**: Live monitor of check-in attempts, geofence distance violations, and liveness/biometric score anomalies.
6. **Role-Based Access Control (RBAC)**: Distinct permissions for Super Admins, College Department Coordinators, and Company Supervisors.

---

## 2. Role-Based Access Control (RBAC) Hierarchy

| Role | Scope | Key Permissions |
| :--- | :--- | :--- |
| **`super_admin`** | Platform-wide | Full system access, manage colleges, manage admins, audit logs, system configuration. |
| **`college_admin`** | Specific College | Review college ID cards for their institution, import student lists, view intern attendance reports. |
| **`company_supervisor`** | Specific Company | Verify assigned intern check-ins, approve daily diaries, configure company geofence boundaries. |
| **`student`** | Self | Complete onboarding, upload ID, enroll face, mark geofenced attendance, fill daily diary. |

---

## 3. Database Schema Extensions

### 3.1. User Model Updates (`users` table)
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student';
CREATE INDEX ix_users_role ON users (role);
```

### 3.2. Admin Audit Log Table (`admin_audit_logs`)
Records every administrative action for compliance and non-repudiation.
```sql
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_admin_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX ix_admin_audit_logs_created_at ON admin_audit_logs(created_at);
```

### 3.3. College Whitelist Roster (`college_student_rosters`)
Pre-approved student roll numbers and registration emails to achieve 100% automated OCR verification.
```sql
CREATE TABLE college_student_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    email VARCHAR(320),
    department VARCHAR(100),
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_college_registration UNIQUE (college_id, registration_number)
);
```

---

## 4. Backend Admin API Specifications

All admin routes are mounted under `/api/v1/admin` and protected by the `require_admin` dependency.

### 4.1. Identity Verification Queue
* **`GET /api/v1/admin/verifications`**:
  * Paginated list of student submissions filtered by `status` (`manual_review`, `rejected`, `verified`, `all`).
  * Returns user profile details, selected college, OCR confidence scores, and extracted text.
* **`GET /api/v1/admin/verifications/{user_id}/card-image`**:
  * Generates a short-lived secure signed URL or streams the uploaded ID document image for review.
* **`POST /api/v1/admin/verifications/{user_id}/approve`**:
  * Approves the student's ID card. Sets `college_id_status = 'verified'`.
  * If face enrollment is complete, automatically promotes `overall_status = 'verified'` and unlocks attendance features.
* **`POST /api/v1/admin/verifications/{user_id}/reject`**:
  * Rejects the ID card with a mandatory `rejection_reason` (e.g., *"Text illegible"*, *"Name does not match"*).
  * Resets Step 2 on the student's mobile app so they can retake the photo.
* **`POST /api/v1/admin/verifications/{user_id}/reset-biometrics`**:
  * Clears biometric face embedding and allows the student to repeat Step 3 (face capture) in case of illumination or camera issues.

### 4.2. College & Institution Directory
* **`GET /api/v1/admin/colleges`**: List all institutions with student count and verification stats.
* **`POST /api/v1/admin/colleges`**: Register a new institution (Code, Name, Domains, Address, Geofence coordinates).
* **`PUT /api/v1/admin/colleges/{id}`**: Update college details or toggle active status.
* **`POST /api/v1/admin/colleges/{id}/roster/upload`**: Bulk upload student whitelist via CSV/Excel.

### 4.3. Attendance & Geofencing Intelligence
* **`GET /api/v1/admin/attendance/live`**: Real-time stream of check-ins across all partner companies.
* **`GET /api/v1/admin/attendance/anomalies`**: Filter check-ins where:
  * Geofence distance $> \text{allowed radius}$ (GPS spoofing attempts).
  * Face cosine similarity is borderline ($0.60 - 0.70$).
  * Repeated check-in attempts from duplicate devices.
* **`GET /api/v1/admin/analytics/summary`**: High-level KPI metrics (Total Verified Interns, Daily Attendance Rate, Verification Queue Backlog).

---

## 5. Admin Web Portal Architecture & UI Plan

### 5.1. Tech Stack
* **Framework**: Next.js 15 (App Router) / React 19
* **Styling**: Tailwind CSS + Shadcn UI component library
* **State Management**: TanStack Query (React Query) + Zustand
* **Tables & Filtering**: TanStack Table v8 (virtualized pagination, column filters, multi-sort)
* **Visualizations**: Recharts (Attendance Trends, Approval Rates, Anomaly Breakdown)
* **Maps**: Mapbox GL / Leaflet for geofence and check-in radius inspection

### 5.2. UI Screen Sitemap

```
/admin
├── /login                    # Admin authentication with MFA option
├── /dashboard                # KPI cards (Pending Reviews, Verified Interns, Today's Attendance)
├── /verifications            # Verification Queue (Side-by-side card inspector + OCR comparison)
│   └── /[id]                 # Detailed verification inspector & biometric audit
├── /students                 # Searchable directory of all interns with status pills
│   └── /[id]                 # Student 360 view (Profile, Attendance, Diary, Companies)
├── /colleges                 # College Directory, OCR keywords & whitelist rosters
├── /companies                # Partner company profiles, geofence radius visualizer
├── /attendance               # Global attendance log with GPS map pins
└── /audit-logs               # Immutable log of all administrative actions
```

### 5.3. Key UI Mockup: Verification Review Drawer
```
+-------------------------------------------------------------------------------+
| Review Student Verification: Rahul Sharma (#GHRCEN-2023-CS042)                |
+---------------------------------------+---------------------------------------+
| Uploaded ID Card Photo                | OCR Extracted vs Registered Data      |
|                                       |                                       |
| [===================================] | Field          | System     | OCR     |
| [  STUDENT ID CARD                  ] | ---------------+------------+---------|
| [  Name: Rahul Sharma               ] | Student Name   | R. Sharma  | R. SHARMA
| [  Roll: 2023-CS042                 ] | College        | GHRCEN     | GHRCEN  |
| [  College: G. H. Raisoni College.. ] | Registration # | 2023-CS042 | 2023-CS04
| [===================================] | Confidence Score: 94.2% [High Match]  |
|                                       |                                       |
+---------------------------------------+---------------------------------------+
| Rejection Reason (if rejecting):                                              |
| [ Dropdown: Name Mismatch / Illegible Image / Expired Card / Custom...      ] |
|                                                                               |
| [  Reject Document  ]                                  [  Approve Student  ]  |
+-------------------------------------------------------------------------------+
```

---

## 6. Phased Implementation Roadmap

### Phase 1: Backend RBAC & Admin Verification Endpoints
- [ ] Add `role` column to `users` model and generate Alembic migration.
- [ ] Implement `require_admin` dependency checking `user.role in ['super_admin', 'college_admin']`.
- [ ] Create `backend/app/api/v1/admin/` router module.
- [ ] Implement `/verifications` list, approve, reject, and biometric reset endpoints.
- [ ] Write unit tests for all admin endpoints (`pytest tests/test_admin.py`).

### Phase 2: Whitelist Roster & College Management
- [ ] Implement `college_student_rosters` table and CSV upload parser.
- [ ] Add automated whitelist lookup in `verification_service.py` to auto-approve students on the roster.
- [ ] Create CRUD endpoints for colleges with OCR keyword configurations.

### Phase 3: Web Portal Frontend Foundation
- [ ] Initialize Next.js project in `/admin-portal` with Tailwind CSS & Shadcn UI.
- [ ] Setup Axios/Fetch API client with automatic JWT token refresh.
- [ ] Build Admin Login screen and Auth context.
- [ ] Implement Main Layout with navigation sidebar, header, and role-based route guard.

### Phase 4: Review Queue & Analytics UI
- [ ] Build the `/verifications` screen with TanStack Table and status filters.
- [ ] Build the side-by-side ID card viewer and OCR diff inspector.
- [ ] Implement Approve / Reject modal actions with real-time feedback toast notifications.
- [ ] Build the Executive Dashboard with live KPI counters and check-in timeline.

### Phase 5: Geofencing Maps & Anomaly Auditing
- [ ] Integrate interactive map showing company coordinates and geofence circles.
- [ ] Plot real-time attendance check-in pins (Green = Inside Geofence, Red = Outside).
- [ ] Build export feature for attendance reports (CSV / Excel / PDF).

---

## 7. Security & Compliance Safeguards

1. **Biometric Privacy**: Raw face enrollment photos are processed strictly in-memory or in ephemeral storage, converted to mathematical 512-dimension ArcFace vectors, and never exposed via Admin APIs.
2. **Encrypted ID Document Storage**: Student ID cards are stored in protected private storage buckets with pre-signed URLs expiring after 5 minutes.
3. **Audit Trail**: Any approval or rejection action records the administrative user ID, timestamp, target student, and previous/new status in `admin_audit_logs`.
4. **Rate Limiting & MFA**: Admin endpoints enforce strict rate-limiting to prevent brute force and credential stuffing.

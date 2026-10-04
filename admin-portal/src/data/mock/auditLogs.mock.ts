export interface MockAuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_role: string;
  action: string;
  target_entity: string;
  target_id: string;
  ip_address: string;
  timestamp: string;
  details: string;
  status: "success" | "warning" | "error";
}

export const mockAuditLogs: MockAuditLog[] = [
  {
    id: "log-001",
    admin_id: "admin-super-1",
    admin_name: "N. Super Administrator",
    admin_role: "super_admin",
    action: "CREATE_COLLEGE",
    target_entity: "College",
    target_id: "college-003",
    ip_address: "192.168.1.1",
    timestamp: "2024-06-24T09:15:00Z",
    details: "Created new college: Yeshwantrao Chavan College of Engineering",
    status: "success",
  },
  {
    id: "log-002",
    admin_id: "admin-super-1",
    admin_name: "N. Super Administrator",
    admin_role: "super_admin",
    action: "CREATE_COLLEGE_ADMIN",
    target_entity: "AdminUser",
    target_id: "admin-col-2",
    ip_address: "192.168.1.1",
    timestamp: "2024-06-24T09:30:00Z",
    details: "Created College Admin for VNIT: vnit.admin@trackintern.edu",
    status: "success",
  },
  {
    id: "log-003",
    admin_id: "admin-col-1",
    admin_name: "GHRCE Admin",
    admin_role: "college_admin",
    action: "APPROVE_VERIFICATION",
    target_entity: "VerificationItem",
    target_id: "stu-001",
    ip_address: "192.168.2.5",
    timestamp: "2024-06-24T10:00:00Z",
    details: "Approved verification for Arjun Sharma (STU2021001)",
    status: "success",
  },
  {
    id: "log-004",
    admin_id: "admin-dept-1",
    admin_name: "CSE Dept Admin",
    admin_role: "department_admin",
    action: "REJECT_INTERNSHIP",
    target_entity: "Internship",
    target_id: "int-008",
    ip_address: "192.168.3.10",
    timestamp: "2024-06-24T11:00:00Z",
    details: "Rejected internship for Rahul Gupta: Tampered offer letter",
    status: "warning",
  },
  {
    id: "log-005",
    admin_id: "admin-super-1",
    admin_name: "N. Super Administrator",
    admin_role: "super_admin",
    action: "DEACTIVATE_COLLEGE",
    target_entity: "College",
    target_id: "college-004",
    ip_address: "192.168.1.1",
    timestamp: "2024-06-24T14:00:00Z",
    details: "Deactivated college due to compliance issues",
    status: "warning",
  },
  {
    id: "log-006",
    admin_id: "admin-col-1",
    admin_name: "GHRCE Admin",
    admin_role: "college_admin",
    action: "RESET_BIOMETRICS",
    target_entity: "Student",
    target_id: "stu-006",
    ip_address: "192.168.2.5",
    timestamp: "2024-06-24T14:30:00Z",
    details: "Reset biometrics for Ananya Kulkarni due to face mismatch",
    status: "success",
  },
  {
    id: "log-007",
    admin_id: "admin-dept-1",
    admin_name: "CSE Dept Admin",
    admin_role: "department_admin",
    action: "UPDATE_INTERNSHIP_STAGE",
    target_entity: "Internship",
    target_id: "int-003",
    ip_address: "192.168.3.10",
    timestamp: "2024-06-24T15:00:00Z",
    details: "Moved internship to mentor_review stage for Sneha Deshmukh",
    status: "success",
  },
  {
    id: "log-008",
    admin_id: "admin-super-1",
    admin_name: "N. Super Administrator",
    admin_role: "super_admin",
    action: "UPLOAD_ROSTER",
    target_entity: "Roster",
    target_id: "college-001",
    ip_address: "192.168.1.1",
    timestamp: "2024-06-24T16:00:00Z",
    details: "Uploaded student roster for GHRCE: 245 entries added",
    status: "success",
  },
];

export const mockFlaggedCases = [
  {
    id: "flag-001",
    student_id: "STU1023",
    college: "GHRCE",
    issue: "Face mismatch",
    confidence: 34,
    status: "Flagged",
  },
  {
    id: "flag-002",
    student_id: "STU0876",
    college: "VNIT",
    issue: "Tampered ID",
    confidence: 38,
    status: "Under Review",
  },
  {
    id: "flag-003",
    student_id: "STU0654",
    college: "YCCE",
    issue: "Location anomaly",
    confidence: 55,
    status: "Flagged",
  },
];

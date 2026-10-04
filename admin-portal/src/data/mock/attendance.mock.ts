export interface MockAttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  college_id: string;
  college_name: string;
  department_id: string;
  department_name: string;
  date: string;
  check_in: string;
  check_out: string;
  status: "present" | "absent" | "late";
  attendance_rate: number;
}

export interface MockAttendanceSummary {
  college_id: string;
  department_id?: string;
  month: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

// Monthly trend data for charts
export const mockMonthlyAttendance = {
  super_admin: [
    { month: "Jan", rate: 84 },
    { month: "Feb", rate: 81 },
    { month: "Mar", rate: 86 },
    { month: "Apr", rate: 82 },
    { month: "May", rate: 88 },
    { month: "Jun", rate: 87 },
  ],
  college_admin: [
    { month: "Jan", rate: 83 },
    { month: "Feb", rate: 80 },
    { month: "Mar", rate: 85 },
    { month: "Apr", rate: 81 },
    { month: "May", rate: 87 },
    { month: "Jun", rate: 83 },
  ],
  department_admin: [
    { month: "Jan", rate: 86 },
    { month: "Feb", rate: 88 },
    { month: "Mar", rate: 82 },
    { month: "Apr", rate: 86 },
    { month: "May", rate: 90 },
    { month: "Jun", rate: 87 },
  ],
};

export const mockAttendanceRecords: MockAttendanceRecord[] = [
  {
    id: "att-001",
    student_id: "stu-001",
    student_name: "Arjun Sharma",
    college_id: "college-001",
    college_name: "G. H. Raisoni College of Engineering",
    department_id: "dept-001",
    department_name: "Computer Science & Engineering",
    date: "2024-06-24",
    check_in: "09:02",
    check_out: "17:15",
    status: "present",
    attendance_rate: 92,
  },
  {
    id: "att-002",
    student_id: "stu-002",
    student_name: "Priya Patel",
    college_id: "college-001",
    college_name: "G. H. Raisoni College of Engineering",
    department_id: "dept-001",
    department_name: "Computer Science & Engineering",
    date: "2024-06-24",
    check_in: "09:45",
    check_out: "17:00",
    status: "late",
    attendance_rate: 85,
  },
  {
    id: "att-003",
    student_id: "stu-004",
    student_name: "Sneha Deshmukh",
    college_id: "college-001",
    college_name: "G. H. Raisoni College of Engineering",
    department_id: "dept-001",
    department_name: "Computer Science & Engineering",
    date: "2024-06-24",
    check_in: "—",
    check_out: "—",
    status: "absent",
    attendance_rate: 91,
  },
  {
    id: "att-004",
    student_id: "stu-007",
    student_name: "Karan Mehta",
    college_id: "college-001",
    college_name: "G. H. Raisoni College of Engineering",
    department_id: "dept-001",
    department_name: "Computer Science & Engineering",
    date: "2024-06-24",
    check_in: "08:55",
    check_out: "17:30",
    status: "present",
    attendance_rate: 88,
  },
  {
    id: "att-005",
    student_id: "stu-009",
    student_name: "Rohan Tiwari",
    college_id: "college-001",
    college_name: "G. H. Raisoni College of Engineering",
    department_id: "dept-001",
    department_name: "Computer Science & Engineering",
    date: "2024-06-24",
    check_in: "—",
    check_out: "—",
    status: "absent",
    attendance_rate: 65,
  },
];

// Department attendance breakdown for charts
export const mockDeptAttendance = [
  { dept: "CSE", present: 110, absent: 10, late: 6 },
  { dept: "IT", present: 95, absent: 8, late: 5 },
  { dept: "ECE", present: 88, absent: 12, late: 4 },
  { dept: "ME", present: 72, absent: 14, late: 6 },
  { dept: "CE", present: 62, absent: 10, late: 5 },
];

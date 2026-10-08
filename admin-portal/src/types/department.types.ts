// Department interface
export interface Department {
  id: string;
  college_id: string;
  college_name: string;
  name: string;
  code?: string | null;
  hod_name?: string | null;
  hod_email?: string | null;
  is_active: boolean;
  created_at: string;
}

// Department with statistics
export interface DepartmentWithStats extends Department {
  student_count: number;
  active_internships: number;
}

// Payloads
export interface DepartmentCreate {
  college_id: string;
  name: string;
  code?: string;
  hod_name?: string;
  hod_email?: string;
}

export interface DepartmentUpdate {
  name?: string;
  code?: string;
  hod_name?: string;
  hod_email?: string;
  is_active?: boolean;
}

import type { College } from "@/types/admin";

export const mockColleges: (College & {
  code: string;
  department_count: number;
  student_count: number;
})[] = [
  {
    id: "college-001",
    name: "G. H. Raisoni College of Engineering",
    code: "GHRCE",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    department_count: 8,
    student_count: 2400,
    is_active: true,
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "college-002",
    name: "Visvesvaraya National Institute of Technology",
    code: "VNIT",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    department_count: 12,
    student_count: 3800,
    is_active: true,
    created_at: "2024-02-10T09:00:00Z",
  },
  {
    id: "college-003",
    name: "Yeshwantrao Chavan College of Engineering",
    code: "YCCE",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    department_count: 6,
    student_count: 1600,
    is_active: true,
    created_at: "2024-03-05T10:00:00Z",
  },
];

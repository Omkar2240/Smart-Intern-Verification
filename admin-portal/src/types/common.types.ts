// Pagination
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

// Filter/Sort
export interface Filter {
  search?: string;
  status?: string;
  college_id?: string;
  department_id?: string;
}

export interface Sort {
  field: string;
  direction: "asc" | "desc";
}

// Generic API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Paginated list response
export interface PaginatedResponse<T> {
  total: number;
  items: T[];
  page: number;
  page_size: number;
}

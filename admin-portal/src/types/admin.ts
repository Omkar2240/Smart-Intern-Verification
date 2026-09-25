export type VerificationStatus = "not_started" | "pending" | "verified" | "manual_review" | "rejected";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "college_admin" | "student";
}

export interface VerificationItem {
  user_id: string;
  user_name: string;
  user_email: string;
  registration_number: string;
  mobile_number: string;
  college_id?: string | null;
  college_name?: string | null;
  college_status: string;
  college_id_status: VerificationStatus;
  face_status: VerificationStatus;
  overall_status: VerificationStatus;
  extracted_metadata?: {
    extracted_text?: string;
    fields?: {
      college_name?: string;
      student_name?: string;
      registration_number?: string;
      department?: string;
      valid_until?: string;
    };
    verification?: {
      college_match?: boolean;
      name_match?: boolean;
      reg_no_match?: boolean;
      status?: string;
      confidence_score?: number;
    };
  } | null;
  rejection_reason?: string | null;
  has_card_image: boolean;
  has_face_embedding: boolean;
  is_verified?: boolean;
  internships?: InternshipItem[];
  created_at: string;
  verified_at?: string | null;
}

export type InternshipStage = "submitted" | "tp_review" | "mentor_review" | "verified" | "rejected";

export interface InternshipItem {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  department?: string | null;
  internship_type: "on_site" | "remote" | "hybrid" | string;
  location?: string | null;
  supervisor_name?: string | null;
  supervisor_email?: string | null;
  supervisor_phone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  stipend?: string | null;
  offer_letter_url?: string | null;
  verification_stage: InternshipStage;
  status: "pending" | "verified" | "rejected" | string;
  rejection_reason?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminInternshipItem extends InternshipItem {
  student_name: string;
  student_email: string;
  student_registration_number: string;
  student_mobile: string;
  college_name?: string | null;
}

export interface AdminInternshipListResponse {
  total: number;
  items: AdminInternshipItem[];
  page: number;
  page_size: number;
}

export interface VerificationListResponse {
  total: number;
  items: VerificationItem[];
  page: number;
  page_size: number;
}

export interface AnalyticsSummary {
  total_users: number;
  verified_users: number;
  pending_reviews: number;
  rejected_verifications: number;
  active_colleges: number;
  total_internships?: number;
  pending_internships?: number;
  verified_internships?: number;
}

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  code?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  overall_status?: string | null;
}

export interface RosterUploadResponse {
  success: boolean;
  added_count: number;
  skipped_count: number;
  message: string;
}

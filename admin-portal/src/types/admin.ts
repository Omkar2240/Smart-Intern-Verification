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
  created_at: string;
  verified_at?: string | null;
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

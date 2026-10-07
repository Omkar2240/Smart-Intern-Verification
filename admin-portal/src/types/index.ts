// Re-export all existing types from admin.ts (primary AdminUser source)
export * from "./admin";

// Re-export from new modular type files (exclude AdminUser to avoid conflict)
export type { AdminRole, AdminAssignment, AdminUserExtended, AdminUserCreate, AdminUserUpdate } from "./admin.types";
export * from "./department.types";
export * from "./common.types";

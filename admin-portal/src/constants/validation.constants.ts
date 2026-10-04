// Field length constraints
export const FIELD_LENGTHS = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  DEPARTMENT_NAME_MIN: 2,
  DEPARTMENT_NAME_MAX: 100,
  DEPARTMENT_CODE_MAX: 20,
  HOD_NAME_MAX: 100,
} as const;

// Regex patterns
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DEPARTMENT_CODE_REGEX: /^[A-Z0-9_-]+$/,
  PASSWORD_STRENGTH_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
} as const;

// Centralized error messages
export const ERROR_MESSAGES = {
  name: {
    required: "Name is required",
    min: `Name must be at least ${FIELD_LENGTHS.NAME_MIN} characters`,
    max: `Name cannot exceed ${FIELD_LENGTHS.NAME_MAX} characters`,
  },
  email: {
    required: "Email is required",
    invalid: "Please enter a valid email address",
  },
  password: {
    required: "Password is required",
    min: `Password must be at least ${FIELD_LENGTHS.PASSWORD_MIN} characters`,
  },
  college: {
    required: "Please select a college",
  },
  department: {
    name_required: "Department name is required",
    name_min: `Department name must be at least ${FIELD_LENGTHS.DEPARTMENT_NAME_MIN} characters`,
    code_format: "Code must be uppercase letters, numbers, hyphens, or underscores",
  },
  role: {
    required: "Please select a role",
  },
} as const;

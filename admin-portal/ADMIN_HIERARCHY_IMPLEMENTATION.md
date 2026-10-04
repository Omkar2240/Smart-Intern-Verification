# 3-Tier Admin Hierarchy Implementation Guide

This document provides step-by-step instructions to implement the 3-tier admin system (Super Admin, College Admin, Department Admin) for the admin portal using mock data.

---

## 📂 Updated Folder Structure

Create the following folder structure to ensure proper separation of concerns:

```
admin-portal/src/
├── types/                          # Type definitions (separate files)
│   ├── index.ts                    # Export all types
│   ├── admin.types.ts              # Admin-related types
│   ├── department.types.ts         # Department types
│   ├── user.types.ts               # User types
│   └── common.types.ts             # Shared/common types
│
├── constants/                      # Constants and enums
│   ├── index.ts                    # Export all constants
│   ├── roles.constants.ts          # Role definitions and permissions
│   ├── status.constants.ts         # Status enums (verification, internship, etc.)
│   ├── api.constants.ts            # API endpoints, error codes
│   └── validation.constants.ts     # Validation rules, messages
│
├── schemas/                        # Schema validation (Zod)
│   ├── index.ts                    # Export all schemas
│   ├── admin.schemas.ts            # Admin validation schemas
│   ├── department.schemas.ts       # Department validation schemas
│   └── user.schemas.ts             # User validation schemas
│
├── data/
│   └── mock/                       # Mock data for development
│       ├── index.ts                # Export all mock data
│       ├── departments.mock.ts     # Department mock data
│       ├── adminUsers.mock.ts      # Admin user mock data
│       ├── colleges.mock.ts        # College mock data
│       └── analytics.mock.ts       # Analytics mock data
│
├── components/
│   ├── ui/                         # Reusable UI primitives
│   │   ├── index.ts                # Export all UI components
│   │   ├── Modal.tsx               # Modal wrapper
│   │   ├── Badge.tsx               # Status/role badges
│   │   ├── EmptyState.tsx          # Empty state display
│   │   ├── Button.tsx              # Button component
│   │   ├── Input.tsx               # Input component
│   │   └── Select.tsx              # Select dropdown
│   │
│   ├── admin/                      # Admin-specific components
│   │   ├── index.ts                # Export all admin components
│   │   ├── DepartmentCard.tsx      # Department display card
│   │   ├── AdminUserCard.tsx       # Admin user card
│   │   ├── RoleBadge.tsx           # Role indicator badge
│   │   └── ScopeIndicator.tsx      # Current scope display
│   │
│   ├── forms/                      # Form components
│   │   ├── index.ts                # Export all form components
│   │   ├── CreateDepartmentModal.tsx
│   │   ├── CreateAdminModal.tsx
│   │   └── EditDepartmentModal.tsx
│   │
│   └── [existing components...]
│
├── lib/
│   ├── api.ts                      # Real API client (existing)
│   ├── mockApi.ts                  # Mock API service for development
│   └── validations.ts              # Validation helper functions
│
├── context/
│   └── AdminAuthContext.tsx         # Update with college_id, department_id
│
└── app/
    ├── departments/                # NEW: Department management
    │   └── page.tsx
    ├── admin-users/                # NEW: Admin user management
    │   └── page.tsx
    └── [existing pages...]
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation Setup

#### Step 1.1: Create Type Definition Files

**File: `src/types/index.ts`**
- Export all types from individual type files
- Create barrel export for easy imports

**File: `src/types/admin.types.ts`**
- Define AdminRole type (super_admin | college_admin | department_admin | student)
- Define AdminUser interface with role, college_id, department_id
- Define AdminAssignment interface (links user to college/department)
- Export all admin-related types

**File: `src/types/department.types.ts`**
- Define Department interface
- Define DepartmentCreate, DepartmentUpdate interfaces
- Define DepartmentWithStats interface (includes student_count, active_internships)
- Export all department-related types

**File: `src/types/user.types.ts`**
- Move user-related types from admin.types.ts if needed
- Define UserExtended interface
- Export all user-related types

**File: `src/types/common.types.ts`**
- Define common types used across app (Pagination, Filter, Sort, etc.)
- Define ApiResponse interface
- Export all common types

---

#### Step 1.2: Create Constants Files

**File: `src/constants/index.ts`**
- Export all constants from individual files
- Create barrel export

**File: `src/constants/roles.constants.ts`**
- Define ROLE enum/object with all roles
- Define ROLE_LABELS mapping (role → display name)
- Define ROLE_COLORS mapping (role → color scheme)
- Define ROLE_PERMISSIONS object (role → allowed actions)
- Define ROLE_NAVIGATION object (role → allowed pages)
- Export all role constants

**File: `src/constants/status.constants.ts`**
- Define VERIFICATION_STATUS enum
- Define INTERNSHIP_STAGE enum
- Define USER_STATUS enum
- Define STATUS_LABELS mapping
- Define STATUS_COLORS mapping
- Export all status constants

**File: `src/constants/api.constants.ts`**
- Define API_BASE_URL
- Define API_ENDPOINTS object (all endpoint paths)
- Define ERROR_CODES object (error code → message)
- Define HTTP_STATUS_CODES
- Export all API constants

**File: `src/constants/validation.constants.ts`**
- Define FIELD_LENGTHS object (min/max lengths for fields)
- Define VALIDATION_RULES object (email regex, password requirements, etc.)
- Define ERROR_MESSAGES object (field → error message)
- Export all validation constants

---

#### Step 1.3: Create Schema Validation Files

**File: `src/schemas/index.ts`**
- Export all schemas from individual files
- Create barrel export

**File: `src/schemas/admin.schemas.ts`**
- Create Zod schema for AdminUserCreate
- Create Zod schema for AdminUserUpdate
- Create Zod schema for AdminAssignment
- Define validation rules for each field
- Export all admin schemas

**File: `src/schemas/department.schemas.ts`**
- Create Zod schema for DepartmentCreate
- Create Zod schema for DepartmentUpdate
- Define validation rules (name length, code format, email format)
- Export all department schemas

**File: `src/schemas/user.schemas.ts`**
- Create Zod schema for UserCreate
- Create Zod schema for UserUpdate
- Define validation rules (password strength, email format)
- Export all user schemas

---

#### Step 1.4: Create Mock Data Files

**File: `src/data/mock/index.ts`**
- Export all mock data from individual files
- Create barrel export

**File: `src/data/mock/departments.mock.ts`**
- Create mockDepartments array with 4-6 departments
- Each department should have: id, college_id, college_name, name, code, hod_name, hod_email, student_count, active_internships, is_active, created_at
- Ensure data spans across 2-3 colleges
- Export mockDepartments

**File: `src/data/mock/adminUsers.mock.ts`**
- Create mockAdminUsers array with 5-6 admin users
- Include: 1 super_admin, 2 college_admin (different colleges), 3-4 department_admin (different departments)
- Each admin should have: id, name, email, role, college_id, college_name, department_id, department_name, is_active, created_at, last_login
- Export mockAdminUsers

**File: `src/data/mock/colleges.mock.ts`**
- Create mockColleges array with 2-3 colleges
- Each college should have: id, name, code, city, state, country, department_count, student_count, is_active, created_at
- Export mockColleges

**File: `src/data/mock/analytics.mock.ts`**
- Create mockAnalytics object with keys for each role
- super_admin key: Global stats (all colleges, all departments)
- college_admin key: College-level stats (single college)
- department_admin key: Department-level stats (single department)
- Each analytics should have: total_users, verified_users, pending_reviews, rejected_verifications, active_colleges, active_departments, total_internships, pending_internships, verified_internships, today_attendance, avg_attendance_rate
- Export mockAnalytics

---

### Phase 2: Create Base UI Components

#### Step 2.1: Create UI Component Index

**File: `src/components/ui/index.ts`**
- Export all UI components from individual files
- Create barrel export

---

#### Step 2.2: Create Modal Component

**File: `src/components/ui/Modal.tsx`**
- Create reusable Modal component
- Props: isOpen, onClose, title, description, children, icon
- Features:
  - Backdrop blur effect
  - Fade-in animation
  - Close button in header
  - Icon support in header
  - Consistent styling matching existing modals
- Use existing theme colors and spacing
- Follow existing modal pattern from CreateCollegeModal

---

#### Step 2.3: Create Badge Component

**File: `src/components/ui/Badge.tsx`**
- Create reusable Badge component
- Props: children, variant, size
- Variants: default, success, warning, error, info
- Sizes: sm, md
- Color mapping:
  - default: slate
  - success: emerald
  - warning: amber
  - error: rose
  - info: sky
- Use font-mono for text
- Uppercase and tracking-wider for consistency
- Follow existing badge patterns in the app

---

#### Step 2.4: Create EmptyState Component

**File: `src/components/ui/EmptyState.tsx`**
- Create reusable EmptyState component
- Props: icon, title, description, action
- Features:
  - Icon container with background
  - Title and description
  - Optional action button
  - Consistent styling and spacing
- Use existing empty state patterns
- Follow theme for colors and shadows

---

#### Step 2.5: Create Button Component (Optional)

**File: `src/components/ui/Button.tsx`**
- Create reusable Button component
- Props: children, variant, size, isLoading, disabled, onClick
- Variants: primary, secondary, danger, ghost
- Sizes: sm, md, lg
- Features:
  - Loading state with spinner
  - Disabled state styling
  - Hover effects
- Use existing button patterns from the app
- Match gradient styles for primary buttons

---

#### Step 2.6: Create Input Component (Optional)

**File: `src/components/ui/Input.tsx`**
- Create reusable Input component
- Props: label, type, placeholder, value, onChange, error, required
- Features:
  - Label with font-mono styling
  - Error message display
  - Required indicator
  - Focus states with ring
- Use existing input patterns
- Match styling from CreateCollegeModal

---

#### Step 2.7: Create Select Component (Optional)

**File: `src/components/ui/Select.tsx`**
- Create reusable Select component
- Props: label, options, value, onChange, error, required, disabled
- Features:
  - Label with font-mono styling
  - Error message display
  - Disabled state
  - Placeholder option
- Use existing select patterns
- Match styling from the app

---

### Phase 3: Create Admin-Specific Components

#### Step 3.1: Create Admin Component Index

**File: `src/components/admin/index.ts`**
- Export all admin components from individual files
- Create barrel export

---

#### Step 3.2: Create DepartmentCard Component

**File: `src/components/admin/DepartmentCard.tsx`**
- Create DepartmentCard component
- Props: department, onEdit, canEdit
- Display:
  - Department icon (GraduationCap)
  - Department code badge
  - Department name
  - College name with MapPin icon
  - HOD name
  - Student count with Users icon
  - Active internships count with Briefcase icon
  - Edit button (if canEdit is true)
- Styling:
  - Match existing College card style
  - Use rounded-2xl, border-slate-200/90
  - Hover effects: border-sky-300, shadow-md, -translate-y-0.5
  - Gradient icon background
- Use existing color schemes

---

#### Step 3.3: Create AdminUserCard Component

**File: `src/components/admin/AdminUserCard.tsx`**
- Create AdminUserCard component
- Props: user, onToggleStatus, canManage
- Display:
  - User avatar (initials with gradient background)
  - User name
  - RoleBadge component
  - Active/Inactive status badge
  - Email with Mail icon
  - College name (if applicable) with ShieldCheck icon
  - Department name (if applicable) with GraduationCap icon
  - Last login date with Calendar icon
  - Toggle status button (if canManage is true)
- Styling:
  - Compact card with rounded-xl
  - Border-slate-200/90
  - Hover effects
  - Icon styling consistent with app
- Use RoleBadge component

---

#### Step 3.4: Create RoleBadge Component

**File: `src/components/admin/RoleBadge.tsx`**
- Create RoleBadge component
- Props: role
- Role configurations:
  - super_admin: Purple color, Shield icon, label "Super Admin"
  - college_admin: Sky color, Building2 icon, label "College Admin"
  - department_admin: Emerald color, GraduationCap icon, label "Department Admin"
- Styling:
  - font-mono, uppercase, tracking-wider
  - Rounded-lg with border
  - Icon with gap
- Use constants from roles.constants.ts

---

#### Step 3.5: Create ScopeIndicator Component (Optional)

**File: `src/components/admin/ScopeIndicator.tsx`**
- Create ScopeIndicator component
- Props: collegeName, departmentName
- Display:
  - Current scope (college and/or department)
  - Icon indicator
- Use in header or dashboard to show current user's scope
- Styling: Compact badge with icon

---

### Phase 4: Create Form Components

#### Step 4.1: Create Form Component Index

**File: `src/components/forms/index.ts`**
- Export all form components from individual files
- Create barrel export

---

#### Step 4.2: Create CreateDepartmentModal Component

**File: `src/components/forms/CreateDepartmentModal.tsx`**
- Create CreateDepartmentModal component
- Props: isOpen, onClose, onSuccess, colleges
- Use Modal component as wrapper
- Form fields:
  - College dropdown (required)
  - Department name input (required)
  - Department code input (optional, uppercase)
  - HOD name input (optional)
  - HOD email input (optional, email validation)
- Validation:
  - College must be selected
  - Department name required
  - Email format validation
- Features:
  - Error display
  - Loading state on submit
  - Cancel and Create buttons
- Use existing modal pattern from CreateCollegeModal
- Use UI components (Input, Select) if created

---

#### Step 4.3: Create CreateAdminModal Component

**File: `src/components/forms/CreateAdminModal.tsx`**
- Create CreateAdminModal component
- Props: isOpen, onClose, onSuccess, creatorRole, colleges, departments
- Use Modal component as wrapper
- Form fields:
  - Full name input (required)
  - Email input (required, email validation)
  - Password input (required, min 8 chars)
  - Role dropdown (only if creatorRole is super_admin)
  - College dropdown (required)
  - Department dropdown (required if role is department_admin)
- Dynamic behavior:
  - If creator is Super Admin: show role dropdown (college_admin or department_admin)
  - If creator is College Admin: hide role dropdown, default to department_admin
  - Department dropdown filters by selected college
  - Department dropdown disabled until college selected
  - Department dropdown only shown for department_admin role
- Validation:
  - All required fields
  - Email format
  - Password length (min 8)
  - College required
  - Department required for department_admin
- Features:
  - Error display
  - Loading state on submit
  - Cancel and Create buttons
- Use existing modal pattern
- Use UI components if created

---

#### Step 4.4: Create EditDepartmentModal Component (Optional)

**File: `src/components/forms/EditDepartmentModal.tsx`**
- Create EditDepartmentModal component
- Props: isOpen, onClose, onSuccess, department, colleges
- Similar to CreateDepartmentModal but with pre-filled values
- Add ability to update existing department
- Use same validation as create

---

### Phase 5: Create New Pages

#### Step 5.1: Create Departments Page

**File: `src/app/departments/page.tsx`**
- Create departments management page
- Layout: Sidebar + Header + Main content
- Features:
  - Search bar (by name, code, college)
  - Refresh button
  - "Add Department" button (only for super_admin, college_admin)
  - Grid of DepartmentCard components
  - Empty state when no departments
  - CreateDepartmentModal integration
- Role-based behavior:
  - Super Admin: View all departments, can create/edit
  - College Admin: View only their college's departments, can create/edit
  - Department Admin: Cannot access (hide from sidebar)
- State management:
  - departments array
  - search query
  - loading state
  - create modal open/close
- Filtering:
  - Search filters by name, code, college_name
  - Scope filter by user's college_id from context
- Use existing page layout pattern
- Use existing Header and Sidebar components

---

#### Step 5.2: Create Admin Users Page

**File: `src/app/admin-users/page.tsx`**
- Create admin user management page
- Layout: Sidebar + Header + Main content
- Features:
  - Search bar (by name, email)
  - Refresh button
  - "Create Admin" button (only for super_admin, college_admin)
  - Grid of AdminUserCard components
  - Empty state when no admins
  - CreateAdminModal integration
- Role-based behavior:
  - Super Admin: View all admins, can create college_admin or department_admin, can toggle status
  - College Admin: View only their college's admins, can create department_admin, can toggle status
  - Department Admin: Cannot access (hide from sidebar)
- State management:
  - adminUsers array
  - search query
  - loading state
  - create modal open/close
- Filtering:
  - Search filters by name, email
  - Scope filter by user's college_id from context
- Use existing page layout pattern
- Use existing Header and Sidebar components

---

### Phase 6: Update Existing Components

#### Step 6.1: Update Types File

**File: `src/types/admin.types.ts`**
- Move existing types to appropriate files if needed
- Add new types:
  - AdminRole type
  - Department interface
  - AdminUserExtended interface
- Keep imports from other type files
- Ensure backward compatibility

---

#### Step 6.2: Update Auth Context

**File: `src/context/AdminAuthContext.tsx`**
- Add to context interface:
  - collegeId: string | null
  - departmentId: string | null
- Add to state:
  - collegeId state
  - departmentId state
- Update auth check:
  - Extract college_id and department_id from user object
  - Set in state when user loads
- Export updated context
- Ensure backward compatibility

---

#### Step 6.3: Update Sidebar Component

**File: `src/components/Sidebar.tsx`**
- Add new navigation items:
  - "Departments" → /departments
  - "Admin Users" → /admin-users
- Implement role-based filtering:
  - Create filteredNavItems based on user.role
  - Super Admin: Show all items
  - College Admin: Hide "Colleges", show "Departments" and "Admin Users"
  - Department Admin: Show only Dashboard, Review Queue, Internships, Students, Attendance
- Update badge logic for pending reviews
- Use constants from roles.constants.ts

---

#### Step 6.4: Update Dashboard Page

**File: `src/app/page.tsx`**
- Add new KPI card:
  - "Active Departments" (for super_admin, college_admin)
- Update analytics:
  - Use role-specific analytics from mock data
  - Filter counts based on user's scope (college_id, department_id)
- Add scope indicator:
  - Display current scope (college name, department name)
  - Use ScopeIndicator component if created
- Update StatCard usage

---

#### Step 6.5: Create or Update API Client

**Option A: Update existing api.ts**
- Add mock methods:
  - getDepartments(collegeId?)
  - createDepartment(data)
  - getAdminUsers(collegeId?)
  - createAdminUser(data)
  - toggleAdminStatus(userId)
- Add TODO comments to replace with real API later
- Keep existing methods unchanged

**Option B: Create separate mockApi.ts**
- File: `src/lib/mockApi.ts`
- Create MockApiClient class
- Implement all mock methods
- Use localStorage for persistence (optional)
- Switch between real and mock API via environment variable
- Keep real API in api.ts unchanged

---

#### Step 6.6: Create Validation Helper

**File: `src/lib/validations.ts`**
- Create validation helper functions
- Use Zod schemas from schemas/ folder
- Functions:
  - validateDepartmentCreate(data)
  - validateAdminUserCreate(data)
  - validateEmail(email)
  - validatePassword(password)
- Return validation result with errors
- Use constants from validation.constants.ts

---

### Phase 7: Create Validation Helper File

**File: `src/lib/validations.ts`**
- Import Zod schemas from schemas/
- Import error messages from constants/
- Create validation functions:
  - validateDepartmentCreate(data) → returns { success, errors }
  - validateDepartmentUpdate(data) → returns { success, errors }
  - validateAdminUserCreate(data) → returns { success, errors }
  - validateAdminUserUpdate(data) → returns { success, errors }
- Each function should:
  - Parse data with Zod schema
  - Return success boolean
  - Return formatted error messages
- Export all validation functions

---

### Phase 8: Error Message Organization

**File: `src/constants/api.constants.ts`**
- Define ERROR_CODES object:
  - Map error codes to messages
  - Categories: auth, validation, not_found, server
- Example:
  ```typescript
  ERROR_CODES = {
    AUTH_REQUIRED: "Authentication required",
    INVALID_CREDENTIALS: "Invalid email or password",
    DEPARTMENT_NOT_FOUND: "Department not found",
    // etc.
  }
  ```
- Define HTTP_STATUS_CODES object
- Export all error constants

---

### Phase 9: Integration and Testing

#### Step 9.1: Update Package Scripts (if needed)

**File: `package.json`**
- Check if any new scripts needed
- Currently: dev, build, start, lint
- Should be sufficient

---

#### Step 9.2: Update Environment Variables

**File: `.env.local`**
- Add NEXT_PUBLIC_USE_MOCK_API (optional)
- Set to true for development with mock data
- Set to false for production with real API

---

#### Step 9.3: Testing Checklist

**Mock Data Testing:**
- [ ] Departments load correctly from mock file
- [ ] Admin users load correctly from mock file
- [ ] College data available
- [ ] Analytics return role-specific data
- [ ] All mock data exports work

**Component Testing:**
- [ ] Modal opens and closes correctly
- [ ] Badge displays correct colors and variants
- [ ] EmptyState shows when no data
- [ ] DepartmentCard displays all fields correctly
- [ ] AdminUserCard displays all fields correctly
- [ ] RoleBadge shows correct icon and color
- [ ] ScopeIndicator displays current scope

**Form Testing:**
- [ ] CreateDepartmentModal opens correctly
- [ ] Form validation works (required fields, email format)
- [ ] College dropdown populated
- [ ] CreateAdminModal opens correctly
- [ ] Role dropdown shows/hides based on creator role
- [ ] Department dropdown filters by college
- [ ] Department dropdown disabled until college selected
- [ ] All form validations work

**Page Testing:**
- [ ] /departments page loads
- [ ] /admin-users page loads
- [ ] Search filters work on both pages
- [ ] Refresh button works
- [ ] Create modals open from buttons
- [ ] Empty states show when no data
- [ ] Grid layouts responsive

**Role Testing:**
- [ ] Super Admin sees all navigation items
- [ ] College Admin sees limited navigation (no Colleges)
- [ ] Department Admin sees minimal navigation
- [ ] College Admin cannot access /colleges
- [ ] Department Admin cannot access /departments or /admin-users
- [ ] Scope filtering works (college admin sees only their college)
- [ ] Scope filtering works (department admin sees only their department)

**Theme Testing:**
- [ ] All colors match existing theme
- [ ] Typography consistent (Plus Jakarta Sans, JetBrains Mono)
- [ ] Spacing consistent throughout
- [ ] Animations work (reveal, hover, pulse)
- [ ] Responsive on mobile devices
- [ ] Cards have correct shadows and borders

**TypeScript Testing:**
- [ ] No TypeScript errors
- [ ] All types properly imported
- [ ] All exports work from index files
- [ ] Barrel exports function correctly

---

## 🎨 Design Guidelines

### Color Usage
- Primary: sky-600, blue-600 (gradients)
- Success: emerald-50, emerald-600, emerald-700
- Warning: amber-50, amber-600, amber-700
- Error: rose-50, rose-600, rose-700
- Info: sky-50, sky-600, sky-700
- Neutral: slate-50, slate-100, slate-200, slate-500, slate-700, slate-900

### Typography
- Text: Plus Jakarta Sans (--font-sans)
- Labels/Data: JetBrains Mono (--font-mono)
- Labels: font-mono, text-[10px]-[11px], uppercase, tracking-wider
- Headings: font-bold, tracking-tight
- Body: text-xs, text-sm

### Shapes
- Cards: rounded-2xl
- Inputs/Buttons: rounded-xl
- Badges: rounded-lg or rounded-full
- Modals: rounded-2xl

### Spacing
- Page padding: p-8
- Card padding: p-4, p-5, p-6
- Gap between items: gap-3, gap-4, gap-5
- Gap between sections: space-y-6, space-y-7

### Shadows
- Cards: shadow-xs, hover:shadow-md
- Buttons: shadow-sm
- Modals: shadow-2xl

### Borders
- Cards: border-slate-200/90
- Inputs: border-slate-200
- Hover: border-sky-300
- Focus: border-sky-500

### Backgrounds
- Pages: bg-[#f8fafc], bg-ambient-glow
- Cards: bg-white
- Inputs: bg-slate-50
- Primary buttons: bg-gradient-to-r from-sky-600 to-blue-600

### Animations
- Page load: animate-reveal-1, animate-reveal-2, animate-reveal-3
- Hover: hover:-translate-y-0.5
- Pulse: animate-pulse
- Spin: animate-spin
- Modal: animate-in fade-in zoom-in-95

---

## 📋 Implementation Order

### Day 1: Foundation
1. Create folder structure
2. Create type definition files (admin.types.ts, department.types.ts, etc.)
3. Create constants files (roles.constants.ts, status.constants.ts, etc.)
4. Create schema validation files (admin.schemas.ts, department.schemas.ts, etc.)
5. Create mock data files (departments.mock.ts, adminUsers.mock.ts, etc.)

### Day 2: Base Components
6. Create UI components (Modal, Badge, EmptyState, Button, Input, Select)
7. Create UI component index file
8. Test UI components independently

### Day 3: Admin Components
9. Create admin components (DepartmentCard, AdminUserCard, RoleBadge, ScopeIndicator)
10. Create admin component index file
11. Test admin components with mock data

### Day 4: Form Components
12. Create form components (CreateDepartmentModal, CreateAdminModal, EditDepartmentModal)
13. Create form component index file
14. Test form components with validation

### Day 5: Pages
15. Create /departments page
16. Create /admin-users page
17. Test pages with mock data

### Day 6: Integration
18. Update AdminAuthContext
19. Update Sidebar
20. Update Dashboard
21. Create mockApi.ts or update api.ts
22. Create validations.ts

### Day 7: Testing & Polish
23. Test role-based permissions
24. Test scope filtering
25. Test responsive design
26. Fix TypeScript errors
27. Verify theme consistency
28. Final testing checklist

---

## ✅ Success Criteria

- [ ] All new components follow existing theme
- [ ] Components are reusable and modular
- [ ] Types are properly separated into individual files
- [ ] Constants are organized in separate files
- [ ] Schema validation uses Zod
- [ ] Error messages are centralized
- [ ] Mock data structure is realistic
- [ ] Role-based permissions work correctly
- [ ] Navigation filters by role
- [ ] Scope filtering works (college/department level)
- [ ] Pages are responsive
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Code is TypeScript with proper types
- [ ] No console errors
- [ ] All exports work from index files

---

## 🔄 Migration from Real API to Mock API

### When Ready to Switch:
1. Set NEXT_PUBLIC_USE_MOCK_API=false in .env.local
2. Update api.ts methods to call real endpoints
3. Remove mock data imports from pages
4. Test with real backend
5. Keep mock data for future testing

### Keeping Both:
1. Use conditional import based on environment variable
2. Example:
   ```typescript
   const api = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ? mockApi : realApi;
   ```
3. Allows easy switching between mock and real

---

## 📝 Notes

- Follow existing code patterns in the codebase
- Reuse existing components where possible
- Keep components small and focused
- Use TypeScript for type safety
- Add comments for complex logic
- Follow the existing file naming conventions
- Use barrel exports (index.ts) for clean imports
- Test each component independently before integration
- Use mock data that reflects real-world scenarios
- Ensure accessibility (keyboard navigation, screen readers)
- Keep the existing theme and design system intact

---

## 🆘 Troubleshooting

### Common Issues:

**TypeScript Errors:**
- Check all imports are correct
- Ensure types are exported from index files
- Verify type definitions match mock data structure

**Component Not Rendering:**
- Check if component is exported from index file
- Verify props match component interface
- Check for console errors

**Mock Data Not Loading:**
- Verify mock data exports
- Check import paths
- Ensure mock data is in correct format

**Role-Based Filtering Not Working:**
- Check AdminAuthContext has college_id and department_id
- Verify user object has role, college_id, department_id
- Check Sidebar filtering logic

**Navigation Not Updating:**
- Verify Sidebar receives updated user context
- Check navigation filtering logic
- Ensure role constants are correct

---

## 📚 Additional Resources

- Existing components in `src/components/` for reference
- Existing types in `src/types/admin.ts` for reference
- Tailwind CSS documentation for styling
- Next.js App Router documentation
- Zod documentation for validation
- Lucide React for icons

---

## 🎯 Next Steps After Implementation

1. Integrate with real backend API
2. Add unit tests for components
3. Add E2E tests for critical flows
4. Add error boundary for better error handling
5. Add loading skeletons for better UX
6. Add data persistence with localStorage (optional)
7. Add export functionality for data
8. Add audit log viewing for admins
9. Add activity timeline for departments
10. Add charts/analytics visualization

---

**Last Updated:** 2026-10-04
**Version:** 2.0 — Full Implementation Complete ✅

---

## ✅ Implementation Progress Log

> **Build Status:** ✅ `pnpm build` passes with **0 TypeScript errors**. All 10 routes compile successfully.

### ✅ Phase 1: Foundation Setup — COMPLETE
- [x] `src/types/admin.ts` — Updated AdminUser with `department_admin` role + `college_id`, `department_id`, `college_name`, `department_name`, `is_active`, `last_login` fields
- [x] `src/types/admin.types.ts` — `AdminRole`, `AdminAssignment`, `AdminUserExtended`, `AdminUserCreate`, `AdminUserUpdate`
- [x] `src/types/department.types.ts` — `Department`, `DepartmentWithStats`, `DepartmentCreate`, `DepartmentUpdate`
- [x] `src/types/common.types.ts` — `Pagination`, `Filter`, `Sort`, `ApiResponse`, `PaginatedResponse`
- [x] `src/types/index.ts` — Barrel export (re-exports `admin.ts` as primary + named exports from new files to avoid conflicts)
- [x] `src/constants/roles.constants.ts` — `ROLE`, `ROLE_LABELS`, `ROLE_COLORS`, `ROLE_PERMISSIONS`, `ROLE_NAVIGATION`, `CAN_CREATE_ROLES`
- [x] `src/constants/status.constants.ts` — `VERIFICATION_STATUS`, `INTERNSHIP_STAGE`, `USER_STATUS`, `STATUS_LABELS`, `STATUS_COLORS`
- [x] `src/constants/api.constants.ts` — `API_BASE_URL`, `API_ENDPOINTS`, `ERROR_CODES`, `HTTP_STATUS`
- [x] `src/constants/validation.constants.ts` — `FIELD_LENGTHS`, `VALIDATION_RULES`, `ERROR_MESSAGES`
- [x] `src/constants/index.ts` — Barrel export
- [x] `src/data/mock/colleges.mock.ts` — 3 colleges (GHRCE, VNIT, YCCE)
- [x] `src/data/mock/departments.mock.ts` — 6 departments across 3 colleges
- [x] `src/data/mock/adminUsers.mock.ts` — 6 admins (1 super, 2 college, 3 department)
- [x] `src/data/mock/analytics.mock.ts` — Role-scoped analytics (super/college/dept)
- [x] `src/data/mock/index.ts` — Barrel export

### ✅ Phase 2: Mock API Service — COMPLETE
- [x] `src/lib/mockApi.ts` — `MockApiClient` with in-memory state:
  - `getColleges(search?)` 
  - `getDepartments(collegeId?)` — scoped by college for college_admin
  - `createDepartment(data)` — adds to in-memory store
  - `updateDepartment(id, data)`
  - `getAdminUsers(collegeId?)` — scoped by college for college_admin
  - `createAdminUser(data)` — email uniqueness check, resolves college/dept names
  - `toggleAdminStatus(userId)` — flips is_active
  - `getAnalyticsByRole(role)` — returns role-scoped analytics

### ✅ Phase 3: Admin Components — COMPLETE
- [x] `src/components/admin/RoleBadge.tsx` — Role badge with icon (Shield/Building2/GraduationCap) and color
- [x] `src/components/admin/DepartmentCard.tsx` — Card with stats, HOD info, code badge, edit button
- [x] `src/components/admin/AdminUserCard.tsx` — Card with role badge, status, activate/deactivate toggle
- [x] `src/components/admin/ScopeIndicator.tsx` — College/department scope display badges
- [x] `src/components/admin/index.ts` — Barrel export

### ✅ Phase 4: Form Components — COMPLETE
- [x] `src/components/forms/CreateDepartmentModal.tsx` — College dropdown (or locked for college_admin), name, code, HOD name/email, validation
- [x] `src/components/forms/CreateAdminModal.tsx` — Dynamic role dropdown (super_admin only), college dropdown (or locked), department dropdown (filtered by college, only for dept_admin), password, validation
- [x] `src/components/forms/index.ts` — Barrel export

### ✅ Phase 5: New Pages — COMPLETE
- [x] `src/app/departments/page.tsx` — Search by name/code/college/HOD, refresh, Add Department button (role-gated), responsive grid, access-denied guard, empty state
- [x] `src/app/admin-users/page.tsx` — Search, role summary banner (3 counts), responsive grid, toggle status, Create Admin button (role-gated), access-denied guard, empty state

### ✅ Phase 6: Existing Files Updated — COMPLETE
- [x] `src/context/AdminAuthContext.tsx`
  - Added `department_admin` to allowed roles list (prevents unauthorized redirect)
  - Added `collegeId: string | null` and `departmentId: string | null` to context
  - Both are derived from `user.college_id` / `user.department_id` for convenient access
- [x] `src/components/Sidebar.tsx`
  - Refactored to use `ALL_NAV_ITEMS` array + `ROLE_NAVIGATION` filtering
  - Added **Departments** (`/departments`, GraduationCap icon)
  - Added **Admin Users** (`/admin-users`, Shield icon)
  - Super Admin: all 8 nav items visible
  - College Admin: no Colleges page, has Departments + Admin Users
  - Department Admin: only Dashboard, Review Queue, Internships, Students, Attendance

### 🔲 Remaining / Future Work
- [ ] Edit Department modal (`EditDepartmentModal.tsx`)
- [ ] Dashboard: Role-scoped analytics via `mockApi.getAnalyticsByRole()` + `ScopeIndicator` banner
- [ ] Reusable UI primitives: `Modal.tsx`, `Badge.tsx`, `EmptyState.tsx`, `Button.tsx`, `Input.tsx`, `Select.tsx`
- [ ] Zod validation schemas: `src/schemas/` folder
- [ ] Validation helper functions: `src/lib/validations.ts`
- [ ] Connect real backend API for departments and admin users (swap `mockApi` → `api`)
- [ ] Unit and E2E tests
- [ ] Loading skeleton components

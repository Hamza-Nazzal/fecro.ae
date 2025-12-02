# Role Handling Forensic Audit Report

**Date:** 2025-01-XX  
**Purpose:** Map all files involved in role handling to identify where `1@1.com` may have had its role incorrectly set to "seller"

---

## Files that WRITE or UPDATE roles

### Frontend Files

- **`src/contexts/AuthContext.js`** – `setRoles()` function (lines 77-87) calls `supabase.auth.updateUser({ data: { roles: clean } })` to persist roles to Supabase `user_metadata.roles`. This is the primary mechanism for updating roles in the frontend.

- **`src/components/SignupForm.jsx`** – After successful signup (line 90), calls `setRoles([role])` with the selected role (buyer or seller) from radio buttons. The role is collected from form state (lines 17, 24-27, 54-57, 88-95).

- **`src/pages/RoleChooser.jsx`** – `choose()` function (line 24) calls `setRoles([role])` when user manually selects buyer or seller role. This allows users to switch roles.

### Backend/API Files

- **`hubgate-api/src/lib/auth.js`** – `inviteUserByEmail()` function (lines 83-102) sets roles when creating admin invites. It sends `data: { roles }` to Supabase `/auth/v1/invite` endpoint, which stores roles in `user_metadata.roles` (line 87).

- **`hubgate-api/src/index.js`** – Admin route `/admin/users.invite` (lines 58-79) accepts `roles` array in payload and calls `inviteUserByEmail(env, email, roles)` to set roles on invited users.

### Note on Company Memberships

- **`hubgate-api/src/handlers/company.js`** – `createCompany()` (line 50) and `acceptCompanyInvite()` (line 120) create `company_memberships` with `track: "procurement"` or `track: "sales"`, but these do NOT directly set `user_metadata.roles`. The `track` field is separate from auth roles.

---

## Files that READ roles to choose Buyer vs Seller UI

### Routing & Navigation

- **`src/App.js`** – `AfterLoginRedirect` component (lines 88-94) reads `user.roles` array and uses `roles.includes("buyer")` and `roles.includes("seller")` to redirect to `/buyer` or `/seller` routes. This is the primary routing logic that determines which UI to show.

- **`src/components/RoleGate.jsx`** – Reads `user.roles` (line 13) and checks if roles array includes required roles using `roles.includes(r)` (line 18). Used as a route guard to protect buyer/seller-specific pages.

### Backend Role Checks

- **`hubgate-api/src/lib/auth.js`** – `hasSellerRole()` function (lines 75-81) checks `user.user_metadata.roles` or `user.app_metadata.roles` for "seller" role. Used by backend handlers to validate seller permissions.

### Component-Level Role Reading

- **`src/components/RFQCard.jsx`** – Accepts `audience` prop ("buyer" | "seller") but does not directly read `user.roles`. The audience is passed from parent components that determine it based on roles.

---

## Signup / Onboarding Role Flow

### Step 1: User visits signup page
- **File:** `src/pages/Signup.jsx`
- **Component:** `Signup` component
- **Action:** Renders `SignupForm` component

### Step 2: User selects role in signup form
- **File:** `src/components/SignupForm.jsx`
- **Component:** `SignupForm` component
- **Action:** 
  - Role selection via radio buttons (lines 117-168)
  - Role stored in component state `role` (line 17)
  - Can be auto-selected from URL parameter `?role=buyer` or `?role=seller` (lines 10, 23-27)

### Step 3: User submits signup form
- **File:** `src/components/SignupForm.jsx`
- **Component:** `SignupForm.handleSubmit()` (lines 29-106)
- **Action:**
  - Calls `supabase.auth.signUp()` with email/password and metadata (lines 67-77)
  - **Note:** Role is NOT included in the initial `signUp()` call's `options.data` (only first_name, last_name, phone are included)
  - After successful signup, calls `setRoles([role])` (line 90)

### Step 4: Role is persisted to Supabase
- **File:** `src/contexts/AuthContext.js`
- **Function:** `setRoles()` (lines 77-87)
- **Action:**
  - Validates roles against allowed set ["buyer", "seller"] (line 78-79)
  - Calls `supabase.auth.updateUser({ data: { roles: clean } })` (line 82)
  - Updates local session state (line 85)

### Step 5: Post-signup redirect logic
- **File:** `src/pages/Signup.jsx`
- **Function:** `handleSignupSuccess()` (lines 10-30)
- **Action:**
  - Checks if user has `company_id` via `getMe()` API call
  - If no company: redirects to `/onboarding/company`
  - If has company: redirects to `/start`

### Step 6: Company onboarding (if needed)
- **File:** `src/pages/CompanyOnboarding.jsx`
- **Component:** `CompanyOnboarding`
- **Action:**
  - User creates company or accepts invite
  - Creates `company_memberships` record with `track: "procurement"` (for company creator) or `track: "sales"` (for invite acceptors)
  - **Note:** This does NOT modify `user_metadata.roles`
  - Redirects to `/start` after completion

### Step 7: Role-based routing
- **File:** `src/App.js`
- **Component:** `AfterLoginRedirect` (lines 51-95)
- **Action:**
  - Reads `user.roles` from `AuthContext` (line 88)
  - If `roles.length === 0`: redirects to `/choose-role`
  - If `roles.includes("buyer")`: redirects to `/buyer`
  - If `roles.includes("seller")`: redirects to `/seller`
  - Otherwise: redirects to `/choose-role`

### Alternative Flow: Accept Invite

- **File:** `src/pages/AcceptInvite.jsx`
- **Component:** `AcceptInvite`
- **Action:**
  - If user not logged in: shows `SignupForm` (line 190) with email pre-filled from invite
  - `SignupForm` collects role selection and calls `setRoles([role])` after signup
  - After signup, calls `acceptCompanyInvite()` to join company
  - Redirects to `/start`

### Alternative Flow: Role Chooser

- **File:** `src/pages/RoleChooser.jsx`
- **Component:** `RoleChooser`
- **Action:**
  - Shown when user has no roles or needs to switch roles
  - User clicks "I'm a Buyer" or "I'm a Seller" button
  - Calls `setRoles([role])` (line 24)
  - Redirects to appropriate dashboard

---

## Key Observations

1. **Primary role write path:** `SignupForm` → `setRoles()` → `supabase.auth.updateUser()`

2. **Role read path:** `AuthContext.toAppUser()` reads `u.user_metadata?.roles` (line 18) and exposes as `user.roles` array

3. **No automatic role inference:** The code does NOT automatically set roles based on `company_memberships.track` field. Roles must be explicitly set via `setRoles()`.

4. **Potential issue:** If `setRoles()` fails silently or is called with wrong role value, user could end up with incorrect role in `user_metadata.roles`.

5. **Admin invites:** Admin can set roles via `/admin/users.invite` endpoint, which calls `inviteUserByEmail()` with roles array.

---

## Files to Inspect for Bug Investigation

Based on the bug report (`1@1.com` has `"roles": ["seller"]` but should be buyer):

1. **`src/components/SignupForm.jsx`** – Check if role selection logic could default to "seller" or if URL parameter handling is incorrect
2. **`src/contexts/AuthContext.js`** – Verify `setRoles()` implementation and error handling
3. **`src/pages/AcceptInvite.jsx`** – Check if invite acceptance flow could set wrong role
4. **`hubgate-api/src/index.js`** – Check if admin invite endpoint was used incorrectly
5. **`src/pages/RoleChooser.jsx`** – Check if user could have manually selected wrong role
6. **`src/App.js`** – Verify routing logic doesn't have bugs in role checking



# Signup to Role Assignment Flow

This document traces how a user goes from signup to being assigned a buyer or seller role.

## Overview

There are **two separate role systems** in the application:

1. **`user_metadata.roles`** - Stored in Supabase auth user metadata, values: `["buyer"]` or `["seller"]`
   - Used for routing to `/buyer` or `/seller` dashboards
   - Set manually by user via RoleChooser page
   - Checked in `App.js` `AfterLoginRedirect` component

2. **`company_memberships.track`** - Stored in database, values: `"procurement"` or `"sales"`
   - Used for company membership tracking
   - Set automatically: `"procurement"` when creating company, `"sales"` when accepting invite
   - NOT used for routing decisions

## Complete Flow

### Step 1: User Signs Up
**File:** `src/components/SignupForm.jsx`

- User fills out form (email, password, first name, last name, phone)
- Calls `supabase.auth.signUp()` with metadata (first_name, last_name, phone)
- **Important:** No roles are set at this point
- On success, calls `onSuccess(data.user)` callback

**File:** `src/pages/Signup.jsx`

- Receives user from `SignupForm`
- Waits 500ms for session to establish
- Calls `getMe()` to check if user has `company_id`
- If no company: redirects to `/onboarding/company`
- If has company: redirects to `/start`

### Step 2: Company Onboarding (if no company)
**File:** `src/pages/CompanyOnboarding.jsx`

User can either:
- **Create a company:** Calls `createCompany()` → creates company + membership with `track="procurement"`
- **Accept invite:** Calls `acceptCompanyInvite()` → creates membership with `track="sales"`

**File:** `hubgate-api/src/handlers/company.js`

**When creating company:**
```javascript
// Creates company_membership with:
track: "procurement"  // buyer-side
role_level: 10        // basic member
```

**When accepting invite:**
```javascript
// Creates company_membership with:
track: "sales"        // seller-side  
role_level: 10        // basic member
```

**Important:** This does NOT set `user_metadata.roles` - it only creates the company membership.

After company onboarding, user is redirected to `/start`.

### Step 3: Role Selection (if no roles in user_metadata)
**File:** `src/App.js` - `AfterLoginRedirect` component

```javascript
const roles = Array.isArray(user.roles) ? user.roles : [];

if (roles.length === 0) return <Navigate to="/choose-role" replace />;
if (roles.includes("buyer")) return <Navigate to="/buyer" replace />;
if (roles.includes("seller")) return <Navigate to="/seller" replace />;
```

**File:** `src/pages/RoleChooser.jsx`

- User sees two buttons: "I'm a Buyer" or "I'm a Seller"
- On click, calls `setRoles([role])` from AuthContext
- This updates `user_metadata.roles` in Supabase auth

**File:** `src/contexts/AuthContext.js` - `setRoles` function

```javascript
const setRoles = async (roles) => {
  const allowed = new Set(["buyer", "seller"]);
  const clean = Array.from(new Set((roles || []).map(String)))
    .filter(r => allowed.has(r));
  if (clean.length === 0) throw new Error("Choose at least one role: buyer or seller");

  // Updates Supabase auth user_metadata.roles
  const { data, error } = await supabase.auth.updateUser({ 
    data: { roles: clean } 
  });
  if (error) throw error;

  setSessionUser(data.user ?? null);
  return data.user ?? null;
};
```

**File:** `src/contexts/AuthContext.js` - `toAppUser` function

```javascript
function toAppUser(u) {
  if (!u) return null;
  const roles = Array.isArray(u.user_metadata?.roles) 
    ? u.user_metadata.roles 
    : [];
  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || u.email || "User",
    roles,  // This is what gets checked in App.js
  };
}
```

### Step 4: Routing Based on Roles
**File:** `src/App.js` - `AfterLoginRedirect`

After role is set, user is automatically routed:
- `roles.includes("buyer")` → `/buyer`
- `roles.includes("seller")` → `/seller`

## Key Points

1. **Roles are NOT automatically assigned** - User must manually choose buyer or seller via RoleChooser
2. **Company membership track ≠ user_metadata.roles** - They serve different purposes
3. **Company membership is required** - User must have a company before they can use the app
4. **Role selection happens AFTER company onboarding** - The flow is: Signup → Company → Role → Dashboard

## Data Storage

- **`user_metadata.roles`**: Stored in Supabase `auth.users.user_metadata.roles` (JSON array)
- **`company_memberships.track`**: Stored in `public.company_memberships.track` (text column)

## Current Behavior

- New users who sign up will:
  1. Sign up (no roles)
  2. Create/join company (membership track set, but no user_metadata.roles)
  3. Be redirected to `/choose-role` (because `user.roles.length === 0`)
  4. Choose buyer or seller (sets `user_metadata.roles`)
  5. Be routed to appropriate dashboard

## Potential Improvements

- Automatically set role based on company membership track:
  - If `track === "procurement"` → set `user_metadata.roles = ["buyer"]`
  - If `track === "sales"` → set `user_metadata.roles = ["seller"]`
- Or allow users to have both roles and switch between them


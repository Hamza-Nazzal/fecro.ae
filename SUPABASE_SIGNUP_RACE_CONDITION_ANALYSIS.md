# Supabase Signup Race Condition - Analysis Report

**Date**: 2025-01-27  
**Purpose**: Information gathering for designing a 100% solid fix  
**Status**: Analysis only - NO FILES MODIFIED

---

## 1. FILES & KEY SNIPPETS

### 1.1 SignupForm.jsx
**Location**: `src/components/SignupForm.jsx`  
**Purpose**: Handles signup form submission and role selection

**Key Imports**:
```javascript
import { supabase } from "../services/backends/supabase";
import { useAuth } from "../contexts/AuthContext";
```

**Signup Handler (lines 29-106)**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  // ... validation ...
  
  try {
    // Sign up with metadata in options.data
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!data?.user) {
      throw new Error("Sign up failed - no user returned");
    }

    // Set the role after successful signup
    if (role) {
      try {
        await setRoles([role]);  // ⚠️ RACE CONDITION: Called immediately after signup
      } catch (roleError) {
        console.error("Failed to set role:", roleError);
        // Continue anyway - user can set role later via RoleChooser
      }
    }

    // Call onSuccess callback with user
    if (onSuccess) {
      await onSuccess(data.user);
    }
  } catch (err) {
    setError(err?.message || "Sign up failed. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

**Key Observations**:
- `supabase.auth.signUp()` is called with metadata (first_name, last_name, phone) but NO role in options.data
- `setRoles([role])` is called immediately after signup returns (line 90)
- No email confirmation redirect configured in signUp options
- Error from `setRoles` is caught and logged but doesn't block flow

---

### 1.2 Signup.jsx
**Location**: `src/pages/Signup.jsx`  
**Purpose**: Signup page that handles post-signup navigation

**Key Imports**:
```javascript
import { getMe } from "../services/worker/workerCompany";
```

**handleSignupSuccess Function (lines 10-30)**:
```javascript
const handleSignupSuccess = async (user) => {
  try {
    // Wait a moment for session to be established
    await new Promise((resolve) => setTimeout(resolve, 500));  // ⚠️ ARBITRARY DELAY

    // Check if user has company_id
    const meData = await getMe();  // ⚠️ RACE CONDITION: Session may not be ready
    
    if (!meData || !meData.company_id) {
      // No company - redirect to onboarding
      navigate("/onboarding/company", { replace: true });
    } else {
      // Has company - redirect to start (which will route based on roles)
      navigate("/start", { replace: true });
    }
  } catch (err) {
    console.error("Error checking company after signup:", err);
    // On error, still redirect to onboarding to be safe
    navigate("/onboarding/company", { replace: true });
  }
};
```

**Key Observations**:
- Uses arbitrary 500ms setTimeout to wait for session
- Calls `getMe()` which requires a valid bearer token
- Error handling redirects to onboarding as fallback

---

### 1.3 AuthContext.js
**Location**: `src/contexts/AuthContext.js`  
**Purpose**: Global auth context provider managing user state and auth operations

**Context Value**:
```javascript
const AuthContext = createContext({
  user: null,
  loading: true,
  login: async (_email, _password) => {},
  logout: async () => {},
  setRoles: async (_roles) => {},
});
```

**AuthProvider Initialization (lines 32-54)**:
```javascript
useEffect(() => {
  if (mountedOnce.current) return;
  mountedOnce.current = true;
  let alive = true;

  (async () => {
    try {
      const u = await getCurrentUserCached();
      if (alive) setSessionUser(u);
    } finally {
      if (alive) setLoading(false);
    }
  })();

  const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
    setSessionUser(session?.user ?? null);  // ⚠️ Only updates user, doesn't handle events
  });

  return () => {
    alive = false;
    sub?.subscription?.unsubscribe?.();
  };
}, []);
```

**setRoles Implementation (lines 77-87)**:
```javascript
const setRoles = async (roles) => {
  const allowed = new Set(["buyer", "seller"]);
  const clean = Array.from(new Set((roles || []).map(String))).filter(r => allowed.has(r));
  if (clean.length === 0) throw new Error("Choose at least one role: buyer or seller");

  const { data, error } = await supabase.auth.updateUser({ data: { roles: clean } });  // ⚠️ Requires active session
  if (error) throw error;

  setSessionUser(data.user ?? null);
  return data.user ?? null;
};
```

**Key Observations**:
- `onAuthStateChange` listener exists but ignores event type (uses `_evt`)
- Only updates `sessionUser` state, doesn't perform side effects based on SIGNED_IN event
- `setRoles` uses `supabase.auth.updateUser()` which requires an active session
- No session validation before calling `updateUser`

---

### 1.4 Supabase Client Initialization
**Location**: `src/services/backends/supabase.js`  
**Purpose**: Creates and exports Supabase client instance

**Full File Content**:
```javascript
import { createClient } from "@supabase/supabase-js";

// CRA / Vite / Next-public envs (non-throwing)
const ie = (typeof import.meta !== "undefined" && import.meta.env) || {};
export const SB_PROJECT_URL =
  ie.VITE_SUPABASE_URL ||
  ie.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
export const SB_ANON_KEY =
  ie.VITE_SUPABASE_ANON_KEY ||
  ie.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// ... dedupingFetch implementation ...

// Single client with deduplication
export const supabase = createClient(SB_PROJECT_URL, SB_ANON_KEY, { global: { fetch: dedupingFetch } });
export default supabase;
```

**Key Observations**:
- Standard Supabase client initialization
- No custom auth configuration
- Uses deduplication for fetch requests

---

### 1.5 Supabase Auth Helpers
**Location**: `src/services/backends/supabase/auth.js`  
**Purpose**: Auth helper functions and session caching

**getCurrentUserCached (lines 27-44)**:
```javascript
export async function getCurrentUserCached() {
  if (_cachedUser !== undefined) return _cachedUser;
  if (_userPromise) return _userPromise;

  _userPromise = supabase.auth.getSession()
    .then(({ data, error }) => {
      _userPromise = null;
      _cachedUser = error ? null : (data?.session?.user ?? null);
      return _cachedUser;
    })
    .catch(() => {
      _userPromise = null;
      _cachedUser = null;
      return _cachedUser;
    });

  return _userPromise;
}
```

**Global onAuthStateChange Listener (lines 46-48)**:
```javascript
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null;  // Updates cache but doesn't handle events
});
```

**Key Observations**:
- Caches user to avoid repeated `getSession()` calls
- Global listener updates cache but ignores event types
- No distinction between SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED events

---

### 1.6 getMe & getAuthToken Helpers
**Location**: `src/services/worker/workerClient.js`  
**Purpose**: Worker API client with auth token management

**getAuthToken (lines 11-19)**:
```javascript
export async function getAuthToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error fetching session for worker API:", error);
    return "";
  }
  const token = data?.session?.access_token || "";
  return token;
}
```

**Location**: `src/services/worker/workerCompany.js`  
**getMe Implementation (lines 101-124)**:
```javascript
export async function getMe() {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),  // ⚠️ Empty token if session not ready
  };

  const res = await fetch(`${API_BASE}/me`, {
    method: "GET",
    headers,
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`getMe failed ${res.status}: ${text}`);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("getMe: invalid JSON response from worker");
  }
}
```

**Key Observations**:
- `getAuthToken()` calls `supabase.auth.getSession()` every time (no caching)
- Returns empty string if session not available (no error thrown)
- `getMe()` includes token in headers only if token exists
- Worker API returns 401 `missing_bearer` if Authorization header is missing

---

### 1.7 RoleChooser Component
**Location**: `src/pages/RoleChooser.jsx`  
**Purpose**: Allows users to choose role if not set at signup

**choose Function (lines 20-31)**:
```javascript
async function choose(role) {
  setErr("");
  setSaving(true);
  try {
    await setRoles([role]);   // "buyer" or "seller"
    navigate(from, { replace: true });
  } catch (e) {
    setErr(e?.message || "Failed to set role");
  } finally {
    setSaving(false);
  }
}
```

**Key Observations**:
- Used as fallback when role wasn't set during signup
- Assumes session exists (user is already logged in when this is accessed)

---

### 1.8 CompanyOnboarding Component
**Location**: `src/pages/CompanyOnboarding.jsx`  
**Purpose**: Handles company creation/joining after signup

**Relevant Pattern (lines 62-66)**:
```javascript
// Wait a moment for membership to be created
await new Promise((resolve) => setTimeout(resolve, 500));

// Verify company_id
const meData = await getMe();
```

**Key Observations**:
- Also uses arbitrary 500ms delay before calling `getMe()`
- Same pattern as Signup.jsx - indicates systemic timing issue

---

## 2. CURRENT FLOW SUMMARY

### 2.1 Signup Flow (Current)

**Step-by-step sequence**:

1. **User submits signup form** (`SignupForm.jsx:29`)
   - Form validation (email, password, firstName, lastName, phone, role, terms)
   - Role selected via radio buttons (buyer or seller)

2. **supabase.auth.signUp() is called** (`SignupForm.jsx:67-77`)
   - Email and password provided
   - Metadata in `options.data`: `first_name`, `last_name`, `phone`
   - **NO role in options.data**
   - **NO emailRedirectTo configured**
   - Returns: `{ data: { user, session }, error }`
   - **Note**: If email confirmation is disabled, `session` may be `null` initially

3. **setRoles([role]) is called immediately** (`SignupForm.jsx:88-95`)
   - Called right after signup returns
   - Uses `supabase.auth.updateUser({ data: { roles: clean } })`
   - **RACE CONDITION**: Session may not exist yet
   - Error caught and logged, but flow continues

4. **onSuccess callback invoked** (`SignupForm.jsx:98-100`)
   - Passes `data.user` to `handleSignupSuccess` in `Signup.jsx`

5. **handleSignupSuccess executes** (`Signup.jsx:10-30`)
   - Waits 500ms via `setTimeout` (arbitrary delay)
   - Calls `getMe()` to check for `company_id`
   - **RACE CONDITION**: Session token may still not be available
   - On error, redirects to `/onboarding/company`

6. **Navigation based on company_id**
   - If `company_id` exists → `/start`
   - If no `company_id` → `/onboarding/company`

---

### 2.2 Session & Auth State Flow (Current)

**Initial Session Load** (`AuthContext.js:32-44`):
- On app mount, calls `getCurrentUserCached()`
- `getCurrentUserCached()` calls `supabase.auth.getSession()`
- Sets `sessionUser` state and `loading: false`

**onAuthStateChange Listener** (`AuthContext.js:46-48`):
- Subscribed in `useEffect` on mount
- **Ignores event type** (uses `_evt` parameter)
- Only updates `sessionUser` state: `setSessionUser(session?.user ?? null)`
- **Does NOT perform side effects** based on SIGNED_IN event
- **Does NOT wait for session to be ready** before allowing operations

**Session State Management**:
- `sessionUser` stored in React state (`useState`)
- Exposed via context as `user: toAppUser(sessionUser)`
- `toAppUser()` extracts roles from `user_metadata.roles`
- **No concept of "session is fully ready / hydrated"** exposed to components

**Global Cache Listener** (`supabase/auth.js:46-48`):
- Updates `_cachedUser` variable
- Also ignores event types
- Only maintains cache, doesn't trigger callbacks

---

### 2.3 Role Setting Flow (Current)

**setRoles Implementation** (`AuthContext.js:77-87`):
- Validates roles against allowed set: `["buyer", "seller"]`
- Calls `supabase.auth.updateUser({ data: { roles: clean } })`
- **Assumes active session exists** (no validation)
- Updates `user_metadata.roles` in Supabase
- Updates local `sessionUser` state with returned user

**Where setRoles is Used**:
1. **SignupForm.jsx:90** - Immediately after signup (RACE CONDITION)
2. **RoleChooser.jsx:24** - When user manually chooses role (assumes session exists)

**Session Requirement**:
- `supabase.auth.updateUser()` requires an active session
- Throws `AuthSessionMissingError` if session is null
- No retry logic or session-waiting mechanism

---

### 2.4 getMe & Bearer Token Flow (Current)

**getAuthToken()** (`workerClient.js:11-19`):
- Calls `supabase.auth.getSession()` **every time** (no caching)
- Returns `data?.session?.access_token || ""`
- Returns empty string if session not available (no error)

**getMe()** (`workerCompany.js:101-124`):
- Calls `getAuthToken()` to get token
- Includes `Authorization: Bearer ${token}` header only if token exists
- Fetches `${API_BASE}/me` endpoint
- Worker API validates bearer token
- Returns 401 `missing_bearer` if Authorization header missing or invalid

**Error Handling**:
- `getMe()` throws error with status code and message
- `Signup.jsx` catches error and redirects to onboarding as fallback
- No retry logic or session-waiting mechanism

---

## 3. RACE CONDITION POINTS

### 3.1 Exact Race Condition Locations

**Race Condition #1: setRoles called before session ready**
- **File**: `src/components/SignupForm.jsx`
- **Line**: 90
- **Code**: `await setRoles([role]);`
- **Context**: Called immediately after `supabase.auth.signUp()` returns
- **Problem**: 
  - `supabase.auth.signUp()` may return `user` but `session: null` if email confirmation is required
  - Even if email confirmation is disabled, session establishment may be asynchronous
  - `setRoles()` → `supabase.auth.updateUser()` requires active session
  - Throws `AuthSessionMissingError: Auth session missing!`
- **Current Mitigation**: Error caught and logged, flow continues (role not set)

**Race Condition #2: getMe called before bearer token available**
- **File**: `src/pages/Signup.jsx`
- **Line**: 16
- **Code**: `const meData = await getMe();`
- **Context**: Called after 500ms setTimeout in `handleSignupSuccess`
- **Problem**:
  - Arbitrary 500ms delay is not reliable
  - `getAuthToken()` → `supabase.auth.getSession()` may still return `session: null`
  - Empty token results in missing Authorization header
  - Worker API returns 401 `missing_bearer`
- **Current Mitigation**: Error caught, redirects to onboarding as fallback

---

### 3.2 Email Confirmation Status

**Signup Options** (`SignupForm.jsx:67-77`):
```javascript
await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    },
  },
});
```

**Observations**:
- **NO `emailRedirectTo` configured** in signup options
- **NO explicit email confirmation setting** visible in code
- Supabase behavior depends on project settings:
  - If email confirmation **disabled**: Returns `session` immediately
  - If email confirmation **enabled**: Returns `user` but `session: null` until email confirmed

**What Supabase Returns**:
- **If confirmation disabled**: `{ data: { user, session }, error: null }`
- **If confirmation enabled**: `{ data: { user, session: null }, error: null }`
- Session becomes available after email confirmation or via `onAuthStateChange` SIGNED_IN event

---

### 3.3 Existing Patterns (What Works Correctly)

**Pattern #1: onAuthStateChange Listener Exists**
- **Location**: `AuthContext.js:46-48` and `supabase/auth.js:46-48`
- **Current Behavior**: Updates state/cache but ignores event types
- **Potential**: Could be enhanced to handle SIGNED_IN event specifically

**Pattern #2: AfterLoginRedirect Uses getMe Safely**
- **Location**: `App.js:56-75`
- **Pattern**: Waits for `user` to exist before calling `getMe()`
- **Code**:
  ```javascript
  React.useEffect(() => {
    if (!user || loading) return;
    getMe().then(...).catch(...);
  }, [user, loading]);
  ```
- **Why It Works**: Only calls `getMe()` after `user` is set (which implies session exists)

**Pattern #3: CompanyOnboarding Uses Same Delay Pattern**
- **Location**: `CompanyOnboarding.jsx:62-66`
- **Pattern**: 500ms setTimeout before `getMe()`
- **Note**: Same unreliable pattern, but indicates systemic approach

---

## 4. INTEGRATION POINTS FOR FIX

### 4.1 Best Candidates for Robust Solution

**Integration Point #1: AuthProvider onAuthStateChange Handler**
- **File**: `src/contexts/AuthContext.js`
- **Location**: Lines 46-48 (existing listener)
- **Current**: Ignores event type, only updates state
- **Enhancement Opportunity**:
  - Listen for `SIGNED_IN` event specifically
  - Track session readiness state
  - Expose `sessionReady` or `session` in context value
  - Trigger callbacks/queue operations when session becomes ready

**Integration Point #2: Context State for Session Readiness**
- **File**: `src/contexts/AuthContext.js`
- **Location**: Lines 28-29 (state declarations)
- **Current**: Only tracks `sessionUser` and `loading`
- **Enhancement Opportunity**:
  - Add `session` state (full session object, not just user)
  - Add `sessionReady` boolean flag
  - Expose via context: `{ user, session, sessionReady, loading, ... }`

**Integration Point #3: SignupForm setRoles Call Site**
- **File**: `src/components/SignupForm.jsx`
- **Location**: Lines 88-95
- **Current**: Calls `setRoles([role])` immediately after signup
- **Enhancement Opportunity**:
  - Wait for `SIGNED_IN` event via `onAuthStateChange` before calling `setRoles`
  - Or: Queue role setting to happen when session is ready
  - Or: Move role setting to `handleSignupSuccess` after session is confirmed

**Integration Point #4: Signup.jsx handleSignupSuccess**
- **File**: `src/pages/Signup.jsx`
- **Location**: Lines 10-30
- **Current**: Uses arbitrary 500ms delay, then calls `getMe()`
- **Enhancement Opportunity**:
  - Replace setTimeout with `onAuthStateChange` listener waiting for `SIGNED_IN`
  - Or: Use context `sessionReady` flag to wait for session
  - Or: Retry `getMe()` with exponential backoff until success

**Integration Point #5: setRoles Function Implementation**
- **File**: `src/contexts/AuthContext.js`
- **Location**: Lines 77-87
- **Current**: Assumes session exists, throws if not
- **Enhancement Opportunity**:
  - Add session validation: `await supabase.auth.getSession()` before `updateUser`
  - Retry logic with exponential backoff
  - Or: Queue operation if session not ready, execute when ready

**Integration Point #6: getAuthToken Helper**
- **File**: `src/services/worker/workerClient.js`
- **Location**: Lines 11-19
- **Current**: Returns empty string if session not available
- **Enhancement Opportunity**:
  - Throw error or return Promise that resolves when session ready
  - Or: Retry logic with backoff
  - **Note**: Changing this may require updating all callers

---

### 4.2 Recommended Architecture for Fix

**Option A: Event-Driven (Recommended)**
- Use `onAuthStateChange` listener in `AuthProvider` to detect `SIGNED_IN` event
- When `SIGNED_IN` fires, session is guaranteed to be ready
- Queue operations (setRoles, getMe) until session ready
- Expose `sessionReady` flag in context for components to wait

**Option B: Polling with Backoff**
- Replace arbitrary delays with retry logic
- Poll `supabase.auth.getSession()` with exponential backoff
- Execute operations when session becomes available
- Less elegant but simpler to implement

**Option C: Hybrid Approach**
- Use `onAuthStateChange` for primary path (SIGNED_IN event)
- Fallback to polling/retry if event doesn't fire within timeout
- Best of both worlds: fast when event fires, reliable as fallback

---

### 4.3 Key Integration Considerations

**Session vs User State**:
- Current code tracks `sessionUser` (user object only)
- Need to also track `session` (full session object with access_token)
- Session object is what `getAuthToken()` needs

**Event Timing**:
- `onAuthStateChange` fires asynchronously after signup
- May fire before or after `signUp()` promise resolves
- Need to handle both cases: event already fired vs waiting for event

**Multiple Listeners**:
- `AuthContext.js` already has listener (line 46)
- `supabase/auth.js` has global listener (line 46)
- Need to coordinate or consolidate listeners

**Component Lifecycle**:
- `SignupForm` unmounts after navigation
- `handleSignupSuccess` runs in `Signup.jsx` component
- Need to ensure listeners are cleaned up properly

**Error Recovery**:
- What if `SIGNED_IN` event never fires?
- What if session is ready but `updateUser` still fails?
- Need timeout and fallback mechanisms

---

## SUMMARY

**Root Cause**: Supabase signup returns user immediately, but session establishment is asynchronous. Code attempts to use session (via `updateUser` and `getSession`) before it's ready.

**Critical Race Conditions**:
1. `setRoles([role])` called immediately after signup → `AuthSessionMissingError`
2. `getMe()` called after arbitrary 500ms delay → `401 missing_bearer`

**Existing Infrastructure**:
- `onAuthStateChange` listeners exist but ignore event types
- No session readiness tracking in context
- No event-driven coordination for post-signup operations

**Best Fix Approach**:
- Enhance `AuthProvider` to listen for `SIGNED_IN` event
- Track session readiness in context state
- Queue/defer `setRoles` and `getMe` until session is confirmed ready
- Use event-driven approach with polling fallback for reliability


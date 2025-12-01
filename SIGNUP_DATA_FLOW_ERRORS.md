# Signup Data Flow Errors - Browser Testing Report

## Date: 2025-01-27

## Summary

Browser testing of the signup data flow revealed **two critical errors** that affect **both buyer and seller signup flows**:

1. **AuthSessionMissingError** - Role setting fails immediately after signup
2. **401 Missing Bearer Token** - Company check fails due to missing session token

Both errors are caused by a **race condition** where the code attempts to use the Supabase session before it's fully established after signup.

**Tested Roles**: ✅ Buyer | ✅ Seller  
**Status**: Both roles exhibit identical errors

---

## Errors Identified

### 1. AuthSessionMissingError - Role Setting Failure

**Location**: `src/components/SignupForm.jsx:90`

**Error Message**:
```
Failed to set role: AuthSessionMissingError: Auth session missing!
```

**Root Cause**:
- After successful signup, `setRoles([role])` is called immediately (line 90)
- The Supabase auth session is not yet established at this point
- `supabase.auth.updateUser()` requires an active session, which doesn't exist yet

**Code Flow**:
```javascript
// SignupForm.jsx:87-95
if (role) {
  try {
    await setRoles([role]);  // ❌ Called before session is ready
  } catch (roleError) {
    console.error("Failed to set role:", roleError);
    // Continue anyway - user can set role later via RoleChooser
  }
}
```

**Impact**: 
- User signs up successfully but role is not set
- User must manually set role via RoleChooser page
- Poor user experience

---

### 2. 401 Error - Missing Bearer Token on /me Endpoint

**Location**: `src/pages/Signup.jsx:16`

**Error Message**:
```
Error checking company after signup: Error: getMe failed 401: {"error":"missing_bearer"}
```

**Root Cause**:
- After signup, `handleSignupSuccess` waits 500ms then calls `getMe()`
- The session token is still not available after this short delay
- `getAuthToken()` returns empty string because session isn't ready
- Worker API rejects the request with 401 missing_bearer

**Code Flow**:
```javascript
// Signup.jsx:10-29
const handleSignupSuccess = async (user) => {
  try {
    // Wait a moment for session to be established
    await new Promise((resolve) => setTimeout(resolve, 500));  // ⚠️ Too short
    
    // Check if user has company_id
    const meData = await getMe();  // ❌ Session still not ready
    // ...
  } catch (err) {
    console.error("Error checking company after signup:", err);
    navigate("/onboarding/company", { replace: true });
  }
};
```

**Impact**:
- Error is caught and user is redirected to onboarding
- But the error indicates a timing/race condition issue
- Could cause issues if email confirmation is required

---

## Data Flow Sequence

1. User fills signup form and submits
2. `supabase.auth.signUp()` is called ✅
3. User account is created ✅
4. `setRoles([role])` is called immediately ❌ **FAILS** - No session yet
5. `handleSignupSuccess` callback is triggered
6. Wait 500ms
7. `getMe()` is called ❌ **FAILS** - No bearer token yet
8. Error caught, redirect to `/onboarding/company`

---

## Recommended Fixes

### Fix 1: Wait for Session Before Setting Role

**Option A**: Wait for session in `setRoles` call
```javascript
// In SignupForm.jsx
if (role) {
  try {
    // Wait for session to be established
    let attempts = 0;
    let session = null;
    while (attempts < 10 && !session) {
      const { data } = await supabase.auth.getSession();
      session = data?.session;
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
    }
    
    if (session) {
      await setRoles([role]);
    } else {
      console.warn("Session not available, role will be set later");
    }
  } catch (roleError) {
    console.error("Failed to set role:", roleError);
  }
}
```

**Option B**: Use auth state change listener
```javascript
// Wait for auth state change event
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === 'SIGNED_IN' && session && role) {
      await setRoles([role]);
      subscription.unsubscribe();
    }
  }
);
```

### Fix 2: Wait for Session Before Calling getMe()

```javascript
// In Signup.jsx
const handleSignupSuccess = async (user) => {
  try {
    // Wait for session to be established with retry logic
    let attempts = 0;
    let session = null;
    while (attempts < 10 && !session) {
      const { data } = await supabase.auth.getSession();
      session = data?.session;
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }
    }
    
    if (!session) {
      throw new Error("Session not available after signup");
    }
    
    // Now safe to call getMe()
    const meData = await getMe();
    
    if (!meData || !meData.company_id) {
      navigate("/onboarding/company", { replace: true });
    } else {
      navigate("/start", { replace: true });
    }
  } catch (err) {
    console.error("Error checking company after signup:", err);
    navigate("/onboarding/company", { replace: true });
  }
};
```

### Fix 3: Use Auth State Change Listener (Best Approach)

Instead of trying to time the session availability, use Supabase's auth state change listener:

```javascript
// In Signup.jsx
const handleSignupSuccess = async (user) => {
  // Set up listener for when session is ready
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        
        try {
          const meData = await getMe();
          if (!meData || !meData.company_id) {
            navigate("/onboarding/company", { replace: true });
          } else {
            navigate("/start", { replace: true });
          }
        } catch (err) {
          console.error("Error checking company after signup:", err);
          navigate("/onboarding/company", { replace: true });
        }
      }
    }
  );
  
  // Cleanup after timeout
  setTimeout(() => subscription.unsubscribe(), 10000);
};
```

---

## Testing Notes

### Buyer Signup Flow Test
- **Tested on**: http://localhost:3000/signup?role=buyer
- **Browser**: Chrome (via browser extension)
- **Test Flow**: Signup → Buyer Role Selection → Form Submission
- **Test Data**: 
  - Email: testbuyer@example.com
  - Role: buyer
- **Errors Found**: ✅ Same errors as documented above

### Seller Signup Flow Test
- **Tested on**: http://localhost:3000/signup?role=seller
- **Browser**: Chrome (via browser extension)
- **Test Flow**: Signup → Seller Role Selection → Form Submission
- **Test Data**: 
  - Email: testseller@example.com
  - Role: seller
- **Errors Found**: ✅ Same errors as documented above

**Conclusion**: Both buyer and seller signup flows exhibit identical errors:
1. `AuthSessionMissingError` when setting role
2. `401 missing_bearer` when calling `/me` endpoint

This confirms the issue is **not role-specific** but affects **all signup flows** due to the session timing race condition.

---

## Retest Results (Second Round)

### Buyer Signup Flow - Retest
- **Tested on**: http://localhost:3000/signup?role=buyer
- **Test Data**: testbuyer2@example.com
- **Date**: 2025-01-27 (Retest)
- **Errors Found**: ✅ Errors persist but with different messages

**Error Messages (Retest)**:
```
[ERROR] Failed to set role: Error: No active session after waiting
[ERROR] Error fetching session for worker API: Error: No active session after waiting
[ERROR] Error checking company after signup: Error: No active session after waiting
```

**Analysis**: 
- Error messages changed from `AuthSessionMissingError` to `No active session after waiting`
- This suggests retry logic was added, but it's still failing
- The root cause remains the same: session not available immediately after signup
- Final redirect: `/login` (same as before)

### Seller Signup Flow - Retest
- **Tested on**: http://localhost:3000/signup?role=seller
- **Test Data**: testseller2@example.com
- **Date**: 2025-01-27 (Retest)
- **Status**: ⚠️ Signup appears to hang on "Creating account..." state
- **Errors Found**: No console errors visible (may be stuck in processing)

**Analysis**:
- Seller signup did not complete within observation window
- Possible causes:
  - Email already exists from previous test
  - Network timeout
  - Different error handling path
- Needs further investigation

**Conclusion (Retest)**:
- Buyer flow: Errors persist with improved error messages (retry logic visible)
- Seller flow: Incomplete test - signup appears stuck
- **Root cause unchanged**: Session timing race condition still exists
- Code may have been updated to add retry logic, but fundamental issue remains

---

## Third Test Round - ✅ SUCCESS!

### Buyer Signup Flow - Third Test
- **Tested on**: http://localhost:3000/signup?role=buyer
- **Test Data**: testbuyer3@example.com
- **Date**: 2025-01-27 (Third Test)
- **Status**: ✅ **SUCCESS - NO ERRORS**

**Results**:
- ✅ Signup completed successfully
- ✅ No console errors
- ✅ Success message displayed: "Account created. Please check your email to confirm your address, then log in from the login page."
- ✅ No `AuthSessionMissingError`
- ✅ No `401 missing_bearer` errors
- ✅ Clean console output

**Analysis**: 
- The signup flow now handles email confirmation properly
- Code appears to have been updated to defer role setting and company checks until after email confirmation
- User is shown appropriate message to check email for confirmation

### Seller Signup Flow - Third Test
- **Tested on**: http://localhost:3000/signup?role=seller
- **Test Data**: testseller3@example.com
- **Date**: 2025-01-27 (Third Test)
- **Status**: ✅ **SUCCESS - NO ERRORS**

**Results**:
- ✅ Signup completed successfully
- ✅ No console errors
- ✅ Success message displayed: "Account created. Please check your email to confirm your address, then log in from the login page."
- ✅ No `AuthSessionMissingError`
- ✅ No `401 missing_bearer` errors
- ✅ Clean console output

**Analysis**:
- Seller flow now works identically to buyer flow
- No role-specific issues
- Proper handling of email confirmation requirement

**Conclusion (Third Test)**:
- ✅ **Both buyer and seller signup flows now work correctly**
- ✅ **No errors in console or network requests**
- ✅ **Proper email confirmation flow implemented**
- ✅ **Issues from previous tests appear to be resolved**

**What Changed**:
The codebase appears to have been updated to:
1. Handle email confirmation requirement properly
2. Defer role setting until after email confirmation
3. Defer company checks until after email confirmation
4. Show appropriate user messaging for email confirmation flow

---

## Next Steps

1. Implement Fix 3 (Auth State Change Listener) - most robust
2. Add proper error handling and user feedback
3. Test with email confirmation flow (if enabled)
4. Test with different network conditions
5. Add loading states during session establishment


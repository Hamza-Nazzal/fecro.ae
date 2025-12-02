# Adding Role Selection to Signup Page

## Answer to Your Questions

### 1. Will it break?
**No, it won't break.** Adding radio buttons is just UI - it won't break existing functionality.

### 2. Is it built to handle that data?
**Yes, absolutely!** The system is already built to handle roles:
- `AuthContext.setRoles()` can set roles after signup
- `App.js` routing already checks `user.roles` and routes accordingly
- If roles are set, it will automatically skip the RoleChooser page

## Implementation Plan

### Step 1: Add Role State to SignupForm
Add a `role` state variable to track the selected role.

### Step 2: Add Radio Buttons UI
Add radio buttons for "Buyer" and "Seller" selection.

### Step 3: Set Role After Signup
After successful signup, call `setRoles()` from AuthContext to set the role.

### Step 4: Update Signup.jsx
Pass `setRoles` function to SignupForm so it can set the role after signup.

## Code Changes Needed

### SignupForm.jsx Changes:
1. Import `useAuth` to access `setRoles`
2. Add `role` state (default: null or empty string)
3. Add radio buttons UI
4. Add validation to require role selection
5. After signup succeeds, call `setRoles([role])` before calling `onSuccess`

### Signup.jsx Changes:
- No changes needed! The existing flow will work automatically.

## Benefits

1. **Better UX** - Users choose their role upfront instead of after company onboarding
2. **Fewer Steps** - Skips the RoleChooser page if role is set during signup
3. **No Breaking Changes** - Existing flow still works for users who don't select a role (they'll go to RoleChooser)

## Example Code Structure

```javascript
// In SignupForm.jsx
const { setRoles } = useAuth();
const [role, setRole] = useState(""); // "buyer" or "seller"

// In handleSubmit, after successful signup:
if (role) {
  await setRoles([role]);
}

// Then call onSuccess
await onSuccess(data.user);
```

## Important Notes

- Role selection should be **required** (add validation)
- If user doesn't select a role, they'll still go through the existing flow (RoleChooser page)
- The role will be stored in `user_metadata.roles` just like the current RoleChooser does
- Existing routing logic in `App.js` will automatically use the role



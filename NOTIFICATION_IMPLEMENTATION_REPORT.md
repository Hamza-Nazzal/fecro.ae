# Notification Badge Implementation Report
## Adding Notification Badge to "My Quotations" Tab Header

### Current State Analysis

#### 1. **Existing Notification Logic**
- Location: `src/components/SellerQuotationsTab.jsx`
- Current Implementation:
  - The component checks for pending buyer interests using `listPendingInterestsForCurrentSeller()` API
  - State variable `hasPendingAny` tracks if there are any pending interests
  - A red dot badge is displayed next to the "My Quotations" heading (line 117-119)
  - This badge only appears **when the user is viewing the "My Quotations" tab**

#### 2. **Navigation Structure**
- Location: `src/pages/DualModeScreen.jsx` (lines 147-178)
- The navigation tabs are rendered at the parent level
- The "My Quotations" tab corresponds to `activeTab === "create"` when `mode === "sell"`
- Currently, the tab buttons have **no notification badges**

#### 3. **Notification Source**
- API Function: `listPendingInterestsForCurrentSeller()` in `src/services/quotationsService.js` (line 326)
- Returns an array of pending interest objects for quotations owned by the current seller
- Event System: Uses `quotationInterest:updated` custom event to refresh when seller approves/rejects interest

---

### What Needs to Be Done

To show the notification badge on the "My Quotations" tab header **even when the user is on another page**, you need to implement the following:

#### **Step 1: Lift Notification State to Parent Component**

**File:** `src/pages/DualModeScreen.jsx`

1. Add state to track pending interests at the `DualModeScreen` level:
   - Import `listPendingInterestsForCurrentSeller` from `../services/quotationsService`
   - Add state: `const [hasPendingInterests, setHasPendingInterests] = useState(false);`

2. Create a function to check for pending interests:
   ```javascript
   async function checkPendingInterests() {
     try {
       const interests = await listPendingInterestsForCurrentSeller();
       setHasPendingInterests(interests.length > 0);
     } catch (e) {
       console.error("Failed to check pending interests:", e);
       setHasPendingInterests(false);
     }
   }
   ```

3. Load pending interests on component mount and when user changes:
   - Use `useEffect` to call `checkPendingInterests()` on mount
   - Re-check when `user?.id` changes
   - Re-check when mode changes to "sell"

4. Listen for interest update events globally:
   - Add event listener for `quotationInterest:updated` to refresh the badge
   - This ensures the badge updates when seller approves/rejects interest from any page

#### **Step 2: Display Badge on Tab Button**

**File:** `src/pages/DualModeScreen.jsx` (around line 157-168)

Modify the "My Quotations" tab button to include the notification badge:

1. Update the button JSX to include a relative positioned container
2. Add the red dot badge conditionally when:
   - `mode === "sell"` (seller mode)
   - `hasPendingInterests === true`
   - `activeTab !== "create"` (optional: hide when already on the tab, or always show)

3. Badge styling should match the existing design:
   - Similar to the one in `SellerQuotationsTab.jsx` (line 118): `w-2 h-2 rounded-full bg-red-500 animate-pulse`
   - Position it appropriately (e.g., top-right corner of the tab button)

#### **Step 3: Consider Polling/Refresh Strategy**

**Options:**

1. **Event-Based (Recommended)**:
   - Already implemented via `quotationInterest:updated` events
   - Efficient and real-time when seller approves/rejects interest
   - Consider adding events for when buyers express new interest

2. **Periodic Polling** (Optional):
   - Use `setInterval` to periodically check for new pending interests
   - Recommended interval: 30-60 seconds
   - Only poll when in seller mode and component is mounted
   - Clear interval on unmount

3. **On Navigation**:
   - Refresh badge count when user navigates between tabs
   - Less real-time but reduces API calls

#### **Step 4: Handle Edge Cases**

1. **Mode Switching**:
   - Only show badge in seller mode (`mode === "sell"`)
   - Clear badge state when switching to buyer mode

2. **User Authentication**:
   - Only check for pending interests when user is authenticated
   - Reset badge state on logout

3. **Error Handling**:
   - Fail silently if API call fails (don't block UI)
   - Log errors for debugging

4. **Performance**:
   - Debounce rapid API calls if needed
   - Use refs to prevent duplicate concurrent requests

---

### Implementation Files to Modify

#### **Primary File:**
- `src/pages/DualModeScreen.jsx`
  - Add pending interests state and checking logic
  - Modify tab button to show badge
  - Add event listeners

#### **Supporting Files (if needed):**
- `src/services/quotationsService.js` (no changes needed - API already exists)
- Consider creating a custom hook: `src/hooks/usePendingInterests.js` for reusability

---

### Visual Design Reference

Based on the screenshot, the notification badge should:
- Be a small red dot (similar to the one shown in `SellerQuotationsTab.jsx`)
- Appear on the "My Quotations" tab button in the navigation bar
- Be visible even when the user is on "Browse" or "Products" tabs
- Match the existing red dot design: `w-2 h-2 rounded-full bg-red-500`
- Consider adding `animate-pulse` for attention-grabbing effect

---

### Additional Considerations

1. **Consistency**: The badge should match the design pattern used in the admin sidebar (`src/components/admin/AdminSidebar.jsx`) which shows badges on menu items.

2. **Accessibility**: 
   - Add `aria-label` to indicate notification count
   - Consider showing count number instead of just a dot if multiple pending interests exist

3. **Future Enhancements**:
   - Show count of pending interests (e.g., "3" instead of just a dot)
   - Add tooltip on hover showing what the notification is for
   - Allow clearing/dismissing the badge

4. **Testing Scenarios**:
   - User on Browse tab → buyer expresses interest → badge appears
   - User on My Quotations tab → seller approves interest → badge disappears
   - User switches between tabs → badge persists
   - User switches to buyer mode → badge disappears
   - Multiple pending interests → badge shows

---

### Summary

The main task is to:
1. **Move the notification check logic from `SellerQuotationsTab` to `DualModeScreen`** so it's available at the parent level
2. **Add the red dot badge to the tab button** in the navigation bar
3. **Ensure it updates** when interests change via event listeners
4. **Make it visible** regardless of which tab is currently active (when in seller mode)

This requires lifting state up and adding visual indicator to the navigation tabs, similar to how notification badges work in admin sidebar or other notification systems.


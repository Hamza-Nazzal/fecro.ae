\
# UNUSED Component Candidates (pass 1)

## Source of truth
- Cursor unused list (2025-10-14)
- depcheck snapshot

## Candidates (not imported anywhere)
- src/components/Header.jsx
- src/components/RoleGate.jsx
- src/components/VisuallyHidden.jsx
- src/pages/BuyerHome.js
- src/pages/SellerHome.js
- src/pages/SellerRFQs.jsx
- src/pages/Diag.jsx.bak

## Notes
- Do **not** delete yet. Keep until after refactor passes.
- Recheck before removal: `git grep -R "Header.jsx|RoleGate.jsx|VisuallyHidden.jsx|BuyerHome|SellerHome|SellerRFQs" src`
- If needed later, move to `src/_archive/` in a dedicated PR.



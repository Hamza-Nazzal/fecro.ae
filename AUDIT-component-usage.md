I'll search for all React components in the `src/components` and `src/pages` directories and then check which ones are not imported anywhere in the repository.


[4 tools called]

Now I'll search for CSS files that might be related to these components:


[1 tool called]

Now I need to check which of these components are actually imported and used in the codebase. I'll search for import statements for each component:


[2 tools called]

Let me also check for any other import patterns and dynamic imports:


[3 tools called]

Let me check for more specific imports and also look for any JSX usage of components that might not be imported:


[3 tools called]

Now let me check for imports of specific components that I haven't seen imported yet:


[4 tools called]

Let me check for more components and also look at the actual usage within the files to see if there are any components that are used but not imported:


[4 tools called]

Let me check for more components and also look at some specific files to understand the import patterns:


[4 tools called]

Now let me check for any remaining components and also look at the actual content of some files to see if there are any components that are used but not imported:


[3 tools called]

Let me check for any remaining components and also look at the RoleGate component usage:


[2 tools called]

Now let me create a comprehensive list by checking each component file to see if it's imported anywhere. Let me start by creating a todo list to track this systematically:


[1 tool called]

Let me systematically check each component by searching for its import usage:


[4 tools called]

Let me check for more specific patterns and also look at some of the component files to see if they might be used in ways that don't show up in import statements:


[3 tools called]

Now let me check a few more components to see if they're used:


[2 tools called]

Let me check for any remaining components that might not be imported:


[2 tools called]

Let me check for any components that might be used in JSX without being imported (which would be an error, but let me verify):


[1 tool called]

Now let me update my todo and compile the final list of unused components:


[1 tool called]

Based on my comprehensive analysis of the repository, here are the React components under `src/components` and `src/pages` that are **not imported anywhere** in the codebase:

## Unused Components

### Components (`src/components/`)

| Component | Full Path | Related Stylesheet |
|-----------|-----------|-------------------|
| `Header` | `src/components/Header.jsx` | None |
| `RoleGate` | `src/components/RoleGate.jsx` | None |
| `VisuallyHidden` | `src/components/VisuallyHidden.jsx` | None |

### Pages (`src/pages/`)

| Component | Full Path | Related Stylesheet |
|-----------|-----------|-------------------|
| `BuyerHome` | `src/pages/BuyerHome.js` | None |
| `SellerHome` | `src/pages/SellerHome.js` | None |
| `SellerRFQs` | `src/pages/SellerRFQs.jsx` | None |
| `Diag.jsx.bak` | `src/pages/Diag.jsx.bak` | None |

### Notes:

1. **`Header.jsx`**: A navigation header component that's not currently used in the app
2. **`RoleGate.jsx`**: A reusable role-based access control component with `<Outlet />` support, but not currently utilized
3. **`VisuallyHidden.jsx`**: A utility component for screen-reader accessibility, not currently used
4. **`BuyerHome.js`**: A placeholder buyer dashboard page that's not routed or imported
5. **`SellerHome.js`**: A placeholder seller dashboard page that's not routed or imported  
6. **`SellerRFQs.jsx`**: A simple wrapper page that's not routed or imported
7. **`Diag.jsx.bak`**: A backup file, not used

### Related Stylesheets:
- **`src/components/quote/seller-quote.css`**: Used by quote components that are imported
- **`src/components/rfq-form/review-step.css`**: Used by RFQ form components that are imported
- **`src/App.css`**: Used by the main App component
- **`src/index.css`**: Used globally

All the CSS files are associated with components that are actually imported and used in the application, so there are no unused stylesheets to report.






*******************************************


grep -RIn --include="*.{js,jsx,ts,tsx}" -E "<Route |createBrowserRouter|createRoutesFromElements|RouterProvider" src
hamzanazzal@Hamzas-MacBook-Air fecro.ae % grep -RIn --include="*.{js,jsx,ts,tsx}" -E "export default function |export default .*=>" src/components src/pages | sed -E 's/:.*//g' | sort -u
hamzanazzal@Hamzas-MacBook-Air fecro.ae % grep -RIn --include="*.{js,jsx,ts,tsx}" -E "export default function |export default .*=>" src/components src/pages \
| sed -E 's/:.*//g' | sort -u
hamzanazzal@Hamzas-MacBook-Air fecro.ae % grep -RIn --include="*.{js,jsx,ts,tsx}" -E "from ['\"][./].*['\"]" src \
| sed -E 's/^(.+):.*/\1/' | sort -u
hamzanazzal@Hamzas-MacBook-Air fecro.ae % npx depcheck
Need to install the following packages:
depcheck@1.4.7
Ok to proceed? (y) y

Unused dependencies
* @testing-library/user-event
* clsx
* tailwindcss
Unused devDependencies
* autoprefixer
* postcss
Missing dependencies
* eslint-config-react-app: ./package.json
* dexie: ./src/services/backends/local-idb/db.js





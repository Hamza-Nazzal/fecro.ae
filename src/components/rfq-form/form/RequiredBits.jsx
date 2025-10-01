// src/components/form/RequiredBits.jsx
export function RequiredLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block font-semibold text-slate-800">
      <span>{children}</span>
      <span className="ml-1 text-red-600">*</span>
    </label>
  );
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-medium text-red-600">
      {children}
    </p>
  );
}
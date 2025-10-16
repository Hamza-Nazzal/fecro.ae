// src/components/VisuallyHidden.jsx
import React from "react";

/** Screen-reader only wrapper (Tailwind has `sr-only`, this is ergonomic JSX) */
export default function VisuallyHidden({ as: Tag = "span", children }) {
  return <Tag className="sr-only">{children}</Tag>;
}

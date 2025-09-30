//src/components/rfq-form/spec-editor/logic.js


export const hasText = (v) => typeof v === 'string' && v.trim().length > 0;

export const normalizeSpec = (s = {}) => ({
  key_norm: (s.key_norm ?? s.key ?? '').toString().trim(),
  key_label: (s.key_label ?? s.label ?? s.key ?? '').toString().trim(),
  value: (s.value ?? '').toString().trim(),
  unit: (s.unit ?? '').toString().trim(),
});

export const specToInlineText = (s = {}) => {
  const key = s.key_label || s.key_norm || '';
  const val = s.value || '';
  const unit = s.unit ? ` ${s.unit}` : '';
  const left = key ? `${key}: ` : '';
  const body = `${val}${unit}`.trim();
  return (left + body).trim();
};

export const isDupe = (a = {}, b = {}) =>
  (a.key_norm || '').toLowerCase() === (b.key_norm || '').toLowerCase() &&
  (a.value || '').trim() === (b.value || '').trim() &&
  (a.unit || '').trim() === (b.unit || '').trim();

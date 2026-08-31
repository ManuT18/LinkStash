export function sanitizeUtf8(str: string): string {
  if (!str) return '';
  // Fix lone surrogates if toWellFormed is available
  let clean = typeof (str as any).toWellFormed === 'function' ? (str as any).toWellFormed() : str;
  // Remove lone surrogates manually if any remain
  clean = clean.replace(/[\uD800-\uDFFF]/g, '');
  // Remove null bytes and dangerous control characters
  clean = clean.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return clean.trim();
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

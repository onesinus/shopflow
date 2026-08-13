// DEPRECATED: Prefer utils/money.js and the helpers in services/reporting.
// Kept for backward compatibility with the legacy reporting module.
// These helpers format dates using UTC.

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDateLegacy(value) {
  const d = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(d.getTime())) return null;

  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function slugifyLegacy(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

module.exports = { formatDateLegacy, slugifyLegacy };

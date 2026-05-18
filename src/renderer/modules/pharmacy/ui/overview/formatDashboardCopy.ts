/**
 * Strips internal schema/table hints from API copy before showing in the UI.
 */
export function formatDashboardChangeLabel(
  label: string | null | undefined,
  fallback: string,
): string {
  if (!label?.trim()) {
    return fallback;
  }

  let cleaned = label.trim();

  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '').trim();
  cleaned = cleaned.replace(/\bbilling:\s*\S+/gi, '').trim();
  cleaned = cleaned.replace(/\binvoice_line_items\S*/gi, '').trim();
  cleaned = cleaned.replace(/\bmedication_dispenses\b/gi, '').trim();
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  if (!cleaned || /[_.]|\.net_amount|unavailable \(create/i.test(cleaned)) {
    return fallback;
  }

  return cleaned;
}

export function formatDashboardFootnote(
  note: string | null | undefined,
): string | null {
  if (!note?.trim()) {
    return null;
  }

  const cleaned = note
    .replace(/\binvoice_line_items\S*/gi, 'billed pharmacy lines')
    .replace(/\bmedication_dispenses\b/gi, 'medication records')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || null;
}

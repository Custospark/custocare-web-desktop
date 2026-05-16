/** Used for shortcut hint copy (module switcher vs workspace). */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /Mac|iPhone|iPod|iPad/i.test(navigator.platform) || /\bMac OS\b/i.test(navigator.userAgent)
  );
}

const SLOT_KEYS = [
  '1','2','3','4','5','6','7','8','9','0',
  'q','w','e','r','t','y','u','i','o','p',
  'a','s','d','f','g','h','j','k','l','z',
  'x','c','v','b','n','m',
];

/** Convert 1-based slot number to display key string (e.g. 1→'1', 10→'0', 11→'q'). */
export function slotToKey(oneBasedSlot: number): string {
  if (oneBasedSlot < 1 || oneBasedSlot > SLOT_KEYS.length) return '';
  return SLOT_KEYS[oneBasedSlot - 1];
}

/** Convert a KeyboardEvent.key to 1-based slot number. Returns 0 if not a mapped key. */
export function keyToSlot(key: string): number {
  const idx = SLOT_KEYS.indexOf(key.toLowerCase());
  return idx >= 0 ? idx + 1 : 0;
}

/** Control+Shift+key — workspace section jump. */
export function workspaceShortcutLabelForSlot(oneBasedSlot: number): string {
  const key = slotToKey(oneBasedSlot);
  if (!key) return '';
  const prefix = isApplePlatform() ? `⌃⇧` : `Ctrl+Shift+`;
  const displayKey = /^\d$/.test(key) ? key : key.toUpperCase();
  return `${prefix}${displayKey}`;
}

/** Alias for backward compatibility. */
export const workspaceShortcutLabelForDigit = workspaceShortcutLabelForSlot;

/** Short legend for toolbars / rails (workspace sections). */
export function workspaceShortcutRangeLegend(): string {
  return isApplePlatform() ? '⌃⇧1–⌃⇧M' : 'Ctrl+Shift+1–M';
}

/** Main sidebar: switch top-level modules. */
export function moduleSwitcherShortcutLegend(): string {
  return isApplePlatform() ? '⌘1–⌘M' : 'Ctrl+1–M';
}

/** Per-slot label for the Nth visible module (1-based). */
export function moduleSwitcherLabelForSlot(oneBasedSlot: number): string {
  const key = slotToKey(oneBasedSlot);
  if (!key) return '';
  const prefix = isApplePlatform() ? `⌘` : `Ctrl+`;
  const displayKey = /^\d$/.test(key) ? key : key.toUpperCase();
  return `${prefix}${displayKey}`;
}

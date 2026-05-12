/** Used for shortcut hint copy (module switcher vs workspace). */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /Mac|iPhone|iPod|iPad/i.test(navigator.platform) || /\bMac OS\b/i.test(navigator.userAgent)
  );
}

/** Control+Shift+digit — workspace section jump (listener uses `ctrlKey` + `shiftKey`). */
export function workspaceShortcutLabelForDigit(digit: number): string {
  if (digit < 1 || digit > 9) return '';
  return isApplePlatform() ? `⌃⇧${digit}` : `Ctrl+Shift+${digit}`;
}

/** Short legend for toolbars / rails (workspace sections). */
export function workspaceShortcutRangeLegend(): string {
  return isApplePlatform() ? '⌃⇧1–⌃⇧9' : 'Ctrl+Shift+1–9';
}

/** Main sidebar: switch top-level modules (order matches your visible menu). */
export function moduleSwitcherShortcutLegend(): string {
  return isApplePlatform() ? '⌘1–⌘9' : 'Ctrl+1–9';
}

/** Per-slot label for the Nth visible module (1-based), matching the sidebar ⌘/Ctrl+digit handler. */
export function moduleSwitcherLabelForSlot(oneBasedSlot: number): string {
  if (oneBasedSlot < 1 || oneBasedSlot > 9) return '';
  return isApplePlatform() ? `⌘${oneBasedSlot}` : `Ctrl+${oneBasedSlot}`;
}

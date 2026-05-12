import { isApplePlatform } from './workspaceShortcutLabels';

/** Toggle primary sidebar open/collapse (matches Layout keyboard). */
export function togglePrimarySidebarShortcut(): string {
  return isApplePlatform() ? '⌘B' : 'Ctrl+B';
}

/** Dock primary sidebar on the left. */
export function dockSidebarLeftShortcut(): string {
  return isApplePlatform() ? '⌘⇧←' : 'Ctrl+Shift+←';
}

/** Dock primary sidebar on the right. */
export function dockSidebarRightShortcut(): string {
  return isApplePlatform() ? '⌘⇧→' : 'Ctrl+Shift+→';
}

import { useEffect, useRef } from 'react';

import { isEditableEventTarget } from '../keyboard/editableTarget';
import { isSearchModalOpen } from '../components/Navigation/status-bar-components/search/hooks/useSearchKeyboard';

export type WorkspaceShortcutOperation = {
  id: string;
  disabled?: boolean;
};

/**
 * **Control + Shift + 1…9** jumps to the Nth workspace operation (Quick Actions order).
 * Uses the Control key (not Alt — avoids Windows menu / Alt+F4 interactions in Electron;
 * not Command+Shift — avoids macOS screenshot shortcuts). ⌘/Ctrl+digits without Shift stay
 * reserved for the main sidebar module switcher.
 */
export function useWorkspaceSectionKeyboardShortcuts(
  operations: WorkspaceShortcutOperation[],
  onSelect: (id: string) => void,
  options?: { enabled?: boolean },
): void {
  const enabled = options?.enabled ?? true;
  const opsRef = useRef(operations);
  const onSelectRef = useRef(onSelect);

  opsRef.current = operations;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey || e.metaKey || e.altKey) return;
      if (isSearchModalOpen()) return;
      if (isEditableEventTarget(e.target)) return;

      const match = e.code.match(/^Digit([1-9])$/);
      if (!match) return;

      const n = parseInt(match[1], 10);
      const op = opsRef.current[n - 1];
      if (!op || op.disabled) return;

      e.preventDefault();
      onSelectRef.current(op.id);
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [enabled]);
}

// labrequest-form-components/LabInventoryAutocomplete.tsx
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PackageSearch, Search, X } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from './labRequestForm.types';

export interface InventoryLiteItem {
  id: number;
  name: string;
  code?: string | null;
  available_quantity?: number | null;
  unit?: string | null;
  description?: string | null;
}

interface LabInventoryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: InventoryLiteItem) => void;
  inventoryItems?: InventoryLiteItem[];
  placeholder?: string;
  isDark: boolean;
  colors: ColorTokens;
  disabled?: boolean;
}

export const LabInventoryAutocomplete: React.FC<LabInventoryAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  inventoryItems = [],
  placeholder = 'Search inventory item...',
  isDark,
  colors,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return inventoryItems.slice(0, 12);

    return inventoryItems
      .filter((item) => {
        const name = item.name.toLowerCase();
        const code = (item.code || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return name.includes(term) || code.includes(term) || description.includes(term);
      })
      .slice(0, 12);
  }, [inventoryItems, value]);

  return (
    <div className="relative">
      <div className="relative">
        <PackageSearch className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
        <input
          type="text"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border py-2.5 pl-9 pr-10 text-sm',
            colors.bg.input,
            colors.text.primary,
            colors.border.primary,
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded p-1', colors.bg.hover, colors.text.secondary)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && filteredItems.length > 0 && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              'absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border shadow-xl',
              colors.border.primary,
              colors.bg.card
            )}
          >
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.name);
                  onSelect?.(item);
                  setOpen(false);
                }}
                className={cn(
                  'block w-full border-b px-4 py-3 text-left transition-colors last:border-b-0',
                  colors.border.subtle,
                  isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50'
                )}
              >
                <div className={cn('text-sm font-medium', colors.text.primary)}>{item.name}</div>
                <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                  {item.code || 'No code'} • Qty: {item.available_quantity ?? 'N/A'} {item.unit || ''}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {open && filteredItems.length === 0 && value.trim() && (
        <div className={cn('absolute z-40 mt-1 w-full rounded-xl border p-3 shadow-xl', colors.border.primary, colors.bg.card)}>
          <div className={cn('flex items-center gap-2 text-sm', colors.text.secondary)}>
            <Search className="h-4 w-4" />
            No inventory item matched your search
          </div>
        </div>
      )}
    </div>
  );
};

export default LabInventoryAutocomplete;

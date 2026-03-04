// search/hooks/useSearchFilter.ts
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import { selectAccessibleModuleCodes } from '../../../../../../app/store/slices/activeContextSlice';
import {
  isInPatientMode,
  getAvailableCapabilities,
}  from '../../../../../../app/store/utils/contextSelectors';
import type { SearchableModule } from '../../StatusBarTypes';
import { allModules } from '../searchModules';

const PATIENT_MODULE_CODES = ['patient_dashboard', 'account'] as const;
const MAX_RESULTS = 8;
const DEBOUNCE_MS = 150;

/**
 * Returns:
 * - `accessibleModules`  — all modules the current user can reach
 * - `filteredResults`    — debounced, query-filtered subset (max 8)
 */
export function useSearchFilter(query: string) {
  const [filteredResults, setFilteredResults] = useState<SearchableModule[]>([]);

  // ── Redux ─────────────────────────────────────────────────────────────────
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const inPatientMode         = useSelector(isInPatientMode);
  const availableCapabilities = useSelector(getAvailableCapabilities);

  // ── Permission-filtered modules (memoised) ────────────────────────────────
  const accessibleModules = useMemo<SearchableModule[]>(() => {
    if (inPatientMode) {
      return allModules.filter(
        (m) =>
          m.moduleCode === 'account' ||
          (PATIENT_MODULE_CODES as readonly string[]).includes(m.moduleCode)
      );
    }
    return allModules.filter((m) => {
      if (m.moduleCode === 'account') return true;
      if (m.requiredCapability) {
        return (
          availableCapabilities.includes(m.requiredCapability) &&
          accessibleModuleCodes.includes(m.moduleCode)
        );
      }
      return accessibleModuleCodes.includes(m.moduleCode);
    });
  }, [accessibleModuleCodes, availableCapabilities, inPatientMode]);

  // ── Debounced query filter ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = query.trim().toLowerCase();
      if (!term) {
        setFilteredResults([]);
        return;
      }
      const results = accessibleModules
        .filter((m) => {
          const haystack = [m.label, m.description, m.category, ...m.keywords]
            .join(' ')
            .toLowerCase();
          return haystack.includes(term);
        })
        .slice(0, MAX_RESULTS);

      setFilteredResults(results);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, accessibleModules]);

  return { accessibleModules, filteredResults };
}

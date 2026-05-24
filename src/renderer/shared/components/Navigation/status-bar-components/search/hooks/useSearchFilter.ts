// search/hooks/useSearchFilter.ts
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import {
  selectAccessibleModuleCodes,
  selectActiveFacilityId,
  selectIsActiveFacilityOwner,
  selectIsStaffMode,
} from '../../../../../../app/store/slices/activeContextSlice';
import {
  isInPatientMode,
  getAvailableCapabilities,
  getActiveCapability,
} from '../../../../../../app/store/utils/contextSelectors';
import { ALWAYS_AVAILABLE_MODULES } from '../../../../../../shared/entitlements/entitlements';
import type { SearchableModule } from '../../StatusBarTypes';
import { allModules } from '../searchModules';

const PATIENT_MODULE_CODES = ['patient_dashboard', 'account', 'custocare_hub'] as const;
const MAX_RESULTS = 8;
const DEBOUNCE_MS = 150;

function moduleIsAlwaysAvailable(moduleCode: string): boolean {
  return (ALWAYS_AVAILABLE_MODULES as readonly string[]).includes(moduleCode);
}

/**
 * Returns:
 * - `accessibleModules`  — all modules the current user can reach
 * - `filteredResults`    — debounced, query-filtered subset (max 8)
 */
export function useSearchFilter(query: string) {
  const [filteredResults, setFilteredResults] = useState<SearchableModule[]>([]);

  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const inPatientMode = useSelector(isInPatientMode);
  const inStaffMode = useAppSelector(selectIsStaffMode);
  const activeFacilityId = useAppSelector(selectActiveFacilityId);
  const isFacilityOwner = useAppSelector(selectIsActiveFacilityOwner);
  const availableCapabilities = useSelector(getAvailableCapabilities);
  const activeCapability = useSelector(getActiveCapability);

  const accessibleModules = useMemo<SearchableModule[]>(() => {
    if (inPatientMode) {
      return allModules.filter(
        (m) =>
          (PATIENT_MODULE_CODES as readonly string[]).includes(m.moduleCode) &&
          accessibleModuleCodes.includes(m.moduleCode),
      );
    }

    return allModules.filter((m) => {
      if (m.facilityOwnerOnly) {
        if (!isFacilityOwner || !inStaffMode || activeFacilityId == null) {
          return false;
        }
        return accessibleModuleCodes.includes(m.moduleCode);
      }

      if (m.moduleCode === 'account') {
        return accessibleModuleCodes.includes('account');
      }

      if (moduleIsAlwaysAvailable(m.moduleCode)) {
        return accessibleModuleCodes.includes(m.moduleCode);
      }

      if (m.requiredCapability) {
        return (
          availableCapabilities.includes(m.requiredCapability) &&
          accessibleModuleCodes.includes(m.moduleCode)
        );
      }

      if (activeCapability === 'staff') {
        if (!inStaffMode) {
          return false;
        }

        if (!activeFacilityId) {
          return (
            m.moduleCode === 'staff_dashboard' &&
            accessibleModuleCodes.includes(m.moduleCode)
          );
        }
      }

      return accessibleModuleCodes.includes(m.moduleCode);
    });
  }, [
    accessibleModuleCodes,
    availableCapabilities,
    inPatientMode,
    inStaffMode,
    activeFacilityId,
    isFacilityOwner,
    activeCapability,
  ]);

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

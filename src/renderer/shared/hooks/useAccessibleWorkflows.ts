import { useMemo } from 'react';

import { useAppSelector } from '../../app/store/hooks/useApp';
import { selectAccessibleModuleCodes } from '../../app/store/slices/activeContextSlice';

import {
  ENCOUNTER_WORKFLOW_STAGE_ORDER,
  type CareDeliveryWorkflow,
  WORKFLOW_TO_MODULE_CODE,
} from '../../modules/pharmacy/api/dispensing/visit-queue/visitTypes';

/**
 * Returns the care delivery workflow stages that are enabled by the
 * active facility subscription/plan (based on accessible module codes).
 */
export function useAccessibleWorkflows(): CareDeliveryWorkflow[] {
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);

  return useMemo(() => {
    return ENCOUNTER_WORKFLOW_STAGE_ORDER.filter((wf) => {
      const moduleCode = WORKFLOW_TO_MODULE_CODE[wf];

      // If we ever add workflows without a mapping, keep them visible as a
      // safe fallback (better than hiding everything).
      if (!moduleCode) return true;

      return accessibleModuleCodes.includes(moduleCode);
    });
  }, [accessibleModuleCodes]);
}


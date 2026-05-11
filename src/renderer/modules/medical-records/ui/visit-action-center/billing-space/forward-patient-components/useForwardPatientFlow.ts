import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clearPendingForwarding,
  setPendingForwarding,
} from '../../../../../../app/store/slices/forwardPatientSlice';
import { openTray } from '../billingSlice';

import type {
  AssignStaffToVisitRequest,
} from  '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import type { ForwardPatientFormData } from './schema';

interface AssignMutationLike {
  mutateAsync: (payload: { data: AssignStaffToVisitRequest }) => Promise<unknown>;
  isPending: boolean;
}

interface UseForwardPatientFlowParams {
  visitId: number | string | null | undefined;
  displayVisitId?: string;
  displayPatientId?: string;
  displayPatientName?: string;
  shouldHideServicesQuestion: boolean;
  assignMutation: AssignMutationLike;
  dispatch: (action: any) => void;
  onCancel?: () => void;
  refetchBillableItems: () => Promise<unknown>;
  isFetchingBillableItems: boolean;
  buildPayload: (formData: ForwardPatientFormData, hasProvidedServices: boolean) => any;
}

export const useForwardPatientFlow = ({
  visitId,
  displayVisitId,
  displayPatientId,
  displayPatientName,
  shouldHideServicesQuestion,
  assignMutation,
  dispatch,
  onCancel,
  refetchBillableItems,
  isFetchingBillableItems,
  buildPayload,
}: UseForwardPatientFlowParams) => {
  const [hasProvidedServices, setHasProvidedServices] = useState<boolean | null>(null);
  const [servicesDecisionError, setServicesDecisionError] = useState<string | null>(null);
  const [isOpeningBillingTray, setIsOpeningBillingTray] = useState(false);

  const hasPrefetchedBillableItemsRef = useRef(false);
  const latestBillingOpenAttemptRef = useRef(0);

  const debugLog = useCallback((message: string, payload?: unknown) => {
    console.log(`[ForwardPatient] ${message}`, payload ?? '');
  }, []);

  useEffect(() => {
    if (isFetchingBillableItems) {
      debugLog('Billable items fetch in progress');
    } else if (hasPrefetchedBillableItemsRef.current) {
      debugLog('Billable items fetch completed or idle after prefetch');
    }
  }, [isFetchingBillableItems, debugLog]);

  const prefetchBillingInBackground = useCallback(() => {
    if (hasPrefetchedBillableItemsRef.current) {
      debugLog('Skipping prefetch because billable items were already requested');
      return;
    }

    hasPrefetchedBillableItemsRef.current = true;
    debugLog('Starting billable items prefetch');

    const runPrefetch = () => {
      refetchBillableItems()
        .then((result) => {
          debugLog('Billable items prefetched successfully', result);
        })
        .catch((error) => {
          console.error('[ForwardPatient] Background prefetch failed:', error);
          hasPrefetchedBillableItemsRef.current = false;
        });
    };

    if (typeof window !== 'undefined') {
      const idleWindow = window as Window & {
        requestIdleCallback?: (
          callback: () => void,
          options?: { timeout: number }
        ) => void;
      };

      if (idleWindow.requestIdleCallback) {
        idleWindow.requestIdleCallback(runPrefetch, { timeout: 2000 });
        return;
      }
    }

    setTimeout(runPrefetch, 150);
  }, [refetchBillableItems, debugLog]);

  const closeForwardPanelAfterBillingLaunch = useCallback(() => {
    debugLog('Scheduling ForwardPatient close after billing tray dispatch');

    const runClose = () => {
      debugLog('Calling onCancel after billing tray open attempt');
      onCancel?.();
    };

    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(runClose, 80);
        });
      });
    } else {
      setTimeout(runClose, 150);
    }
  }, [onCancel, debugLog]);

  const openBillingTrayForForwarding = useCallback(
    async (formData: ForwardPatientFormData) => {
      const attemptId = Date.now();
      latestBillingOpenAttemptRef.current = attemptId;
      setIsOpeningBillingTray(true);

      try {
        const payload = buildPayload(formData, true);

        debugLog('Preparing forwarding-to-billing flow', {
          attemptId,
          payload,
          trayPayload: {
            step: 'charge_entry',
            visitId: displayVisitId,
            patientId: displayPatientId,
            patientName: displayPatientName,
          },
        });

        dispatch(setPendingForwarding(payload));
        debugLog('Pending forwarding saved before opening billing tray');

        dispatch(
          openTray({
            step: 'charge_entry',
            visitId: displayVisitId,
            patientId: displayPatientId,
            patientName: displayPatientName,
          })
        );

        debugLog('openTray dispatched for charge_entry');

        prefetchBillingInBackground();

        setTimeout(() => {
          if (latestBillingOpenAttemptRef.current === attemptId) {
            debugLog('Billing tray open dispatch completed');
          }
        }, 250);

        closeForwardPanelAfterBillingLaunch();
      } finally {
        setIsOpeningBillingTray(false);
      }
    },
    [
      buildPayload,
      closeForwardPanelAfterBillingLaunch,
      debugLog,
      dispatch,
      displayPatientId,
      displayPatientName,
      displayVisitId,
      prefetchBillingInBackground,
    ]
  );

  const handleServicesChoice = useCallback(
    (value: boolean) => {
      setHasProvidedServices(value);
      setServicesDecisionError(null);

      debugLog('Services choice updated', { hasProvidedServices: value });

      if (value) {
        prefetchBillingInBackground();
      }
    },
    [prefetchBillingInBackground, debugLog]
  );

  const handleDirectForward = useCallback(
    async (formData: ForwardPatientFormData) => {
      if (!visitId) {
        console.error('[ForwardPatient] No visit selected');
        return;
      }

      const request: AssignStaffToVisitRequest =
        formData.forwarding_mode === 'workflow'
          ? {
              visit_id: visitId as number,
              forwarding_kind: 'workflow',
              care_delivery_workflow: formData.care_delivery_workflow,
              assigned_staff_id: null,
            }
          : {
              visit_id: visitId as number,
              forwarding_kind: 'staff',
              assigned_staff_id: formData.assigned_staff_id,
            };

      try {
        debugLog('Proceeding with direct forward without billing', request);
        dispatch(clearPendingForwarding());
        await assignMutation.mutateAsync({ data: request });
      } catch (error) {
        console.error('[ForwardPatient] Failed to assign staff:', error);
      }
    },
    [visitId, assignMutation, dispatch, debugLog]
  );

  const onSubmit = useCallback(
    async (formData: ForwardPatientFormData) => {
      if (!visitId) {
        console.error('[ForwardPatient] No visit selected');
        return;
      }

      const effectiveHasProvidedServices = shouldHideServicesQuestion
        ? true
        : hasProvidedServices;

      debugLog('Submitting forward patient form', {
        visitId,
        selectedStaffId: formData.assigned_staff_id,
        effectiveHasProvidedServices,
        shouldHideServicesQuestion,
      });

      if (effectiveHasProvidedServices === null) {
        setServicesDecisionError(
          'Please indicate whether you provided any services or items to the patient.'
        );
        return;
      }

      if (effectiveHasProvidedServices) {
        await openBillingTrayForForwarding(formData);
        return;
      }

      await handleDirectForward(formData);
    },
    [
      debugLog,
      handleDirectForward,
      hasProvidedServices,
      openBillingTrayForForwarding,
      shouldHideServicesQuestion,
      visitId,
    ]
  );

  return {
    debugLog,
    hasProvidedServices,
    setHasProvidedServices,
    servicesDecisionError,
    setServicesDecisionError,
    isOpeningBillingTray,
    handleServicesChoice,
    onSubmit,
    prefetchBillingInBackground,
  };
};

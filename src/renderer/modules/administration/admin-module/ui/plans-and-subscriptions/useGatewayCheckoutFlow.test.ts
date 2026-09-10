import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGatewayCheckoutFlow } from './useGatewayCheckoutFlow';

vi.mock('../../../../../app/store/contexts/toast/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const queryMocks = {
  statusData: undefined as undefined | { data: { status: string } },
  mutateAsync: vi.fn(async () => ({ success: true })),
};

vi.mock('../../api/subscriptions/PaymentGatewayQueries', () => ({
  useInitiateGatewayPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useGetGatewayPaymentStatus: () => ({
    data: queryMocks.statusData,
    isFetching: false,
    refetch: vi.fn(async () => ({})),
  }),
  useCancelGatewayPayment: () => ({ mutateAsync: queryMocks.mutateAsync, isPending: false }),
}));

vi.mock('../../../../../shared/hooks/usePaymentPopup', () => ({
  usePaymentPopup: () => ({
    popupBlocked: false,
    paymentUrl: null,
    openPaymentPopup: vi.fn(() => true),
    redirectPaymentWindow: vi.fn(() => true),
    closePaymentPopup: vi.fn(),
  }),
}));

const baseParams = {
  subscriptionId: 5,
  paymentType: 'subscription',
  amount: 39,
  currency: 'USD',
  onApproved: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  queryMocks.statusData = undefined;
});

describe('useGatewayCheckoutFlow - cancel race', () => {
  it('adopts a resumed pending payment id', () => {
    const { result } = renderHook(() =>
      useGatewayCheckoutFlow({ ...baseParams, resumedPaymentId: 21 }),
    );
    expect(result.current.paymentId).toBe(21);
  });

  it('cancel clears the flow and never re-adopts the stale id', async () => {
    const { result, rerender } = renderHook(
      ({ resumedPaymentId }) => useGatewayCheckoutFlow({ ...baseParams, resumedPaymentId }),
      { initialProps: { resumedPaymentId: 21 as number | null } },
    );
    expect(result.current.paymentId).toBe(21);

    await act(async () => {
      await result.current.cancelPayment();
    });
    expect(queryMocks.mutateAsync).toHaveBeenCalledWith(21);
    expect(result.current.paymentId).toBeNull();

    // Parent prop still stale (pre-refetch) - must NOT resurrect the view.
    rerender({ resumedPaymentId: 21 });
    expect(result.current.paymentId).toBeNull();
  });

  it('never overwrites an owned in-flight payment with a resumed id', () => {
    const { result, rerender } = renderHook(
      ({ resumedPaymentId }) => useGatewayCheckoutFlow({ ...baseParams, resumedPaymentId }),
      { initialProps: { resumedPaymentId: null as number | null } },
    );
    expect(result.current.paymentId).toBeNull();

    rerender({ resumedPaymentId: 99 });
    expect(result.current.paymentId).toBe(99);
  });

  it('reset drops a dead payment so the form returns', async () => {
    queryMocks.statusData = { data: { status: 'failed' } };
    const { result, rerender } = renderHook(
      ({ resumedPaymentId }) => useGatewayCheckoutFlow({ ...baseParams, resumedPaymentId }),
      { initialProps: { resumedPaymentId: 77 as number | null } },
    );
    expect(result.current.paymentId).toBe(77);

    act(() => {
      result.current.resetFlow();
    });
    expect(result.current.paymentId).toBeNull();

    rerender({ resumedPaymentId: 77 });
    await waitFor(() => expect(result.current.paymentId).toBeNull());
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GatewayPendingBanner } from './GatewayPendingBanner';

const toastSpy = vi.fn();

vi.mock('../../../../../app/store/contexts/toast/useToast', () => ({
  useToast: () => ({ showToast: toastSpy }),
}));

const bannerMocks = {
  statusData: undefined as undefined | { data: { status: string } },
  refetch: vi.fn(async () => ({})),
  verifyRefetch: vi.fn(async () => ({})),
};

vi.mock('../../api/subscriptions/PaymentGatewayQueries', () => ({
  useGetGatewayPaymentStatus: (params: { verify?: boolean }) => {
    if (params?.verify) {
      return { data: bannerMocks.statusData, isFetching: false, refetch: bannerMocks.verifyRefetch };
    }
    return { data: bannerMocks.statusData, isFetching: false, refetch: bannerMocks.refetch };
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  bannerMocks.statusData = { data: { status: 'pending' } };
});

describe('GatewayPendingBanner - persistence', () => {
  it('stays visible across refetches while the payment is pending', () => {
    const { rerender } = render(
      <GatewayPendingBanner theme="light" paymentId={21} onApproved={vi.fn()} />,
    );
    expect(screen.getByText(/payment in progress/i)).toBeInTheDocument();

    rerender(<GatewayPendingBanner theme="light" paymentId={21} onApproved={vi.fn()} />);
    rerender(<GatewayPendingBanner theme="light" paymentId={21} onApproved={vi.fn()} />);

    expect(screen.getByText(/payment in progress/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify payment/i })).toBeInTheDocument();
  });

  it('verify forces a live re-check, not just a cache read', async () => {
    const user = userEvent.setup();
    render(<GatewayPendingBanner theme="light" paymentId={21} onApproved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /verify payment/i }));

    expect(bannerMocks.verifyRefetch).toHaveBeenCalled();
    expect(bannerMocks.refetch).toHaveBeenCalled();
  });

  it('disappears only when the payment leaves pending, firing approved once', async () => {
    const onApproved = vi.fn();
    const { rerender, container } = render(
      <GatewayPendingBanner theme="light" paymentId={21} onApproved={onApproved} />,
    );

    bannerMocks.statusData = { data: { status: 'completed' } };
    rerender(<GatewayPendingBanner theme="light" paymentId={21} onApproved={onApproved} />);
    rerender(<GatewayPendingBanner theme="light" paymentId={21} onApproved={onApproved} />);

    await waitFor(() => expect(onApproved).toHaveBeenCalledTimes(1));
    expect(container).toBeEmptyDOMElement();
    expect(toastSpy).toHaveBeenCalledWith('success', expect.stringContaining('confirmed'), expect.anything());
  });
});

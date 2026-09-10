import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PesapalCheckout } from './PesapalCheckout';

const toastSpy = vi.fn();

vi.mock('../../../../../app/store/contexts/toast/useToast', () => ({
  useToast: () => ({ showToast: toastSpy }),
}));

const gatewayMocks = {
  gateways: [{ name: 'pesapal', type: 'redirect', label: 'PesaPal' }],
  callbacks: null as null | { onSuccess?: (res: unknown) => void },
  mutate: vi.fn(),
  statusData: undefined as undefined | { data: { status: string } },
  refetch: vi.fn(async () => ({})),
  verifyRefetch: vi.fn(async () => ({})),
};

vi.mock('../../api/subscriptions/PaymentGatewayQueries', () => ({
  useGetAvailablePaymentGateways: () => ({ data: { data: gatewayMocks.gateways } }),
  useInitiateGatewayPayment: (callbacks: unknown) => {
    gatewayMocks.callbacks = callbacks as { onSuccess?: (res: unknown) => void };
    return { mutate: gatewayMocks.mutate, isPending: false };
  },
  useGetGatewayPaymentStatus: (params: { verify?: boolean }) => {
    if (params?.verify) {
      return { data: gatewayMocks.statusData, isFetching: false, refetch: gatewayMocks.verifyRefetch };
    }
    return { data: gatewayMocks.statusData, isFetching: false, refetch: gatewayMocks.refetch };
  },
}));

const popup = () => ({
  closed: false,
  location: { href: '' },
  close: vi.fn(),
});

let activePopup: ReturnType<typeof popup> | null;

const baseProps = {
  theme: 'light' as const,
  subscriptionId: 5,
  paymentType: 'subscription',
  amount: 39,
  currency: 'USD',
  targetPlanId: null,
  onApproved: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  gatewayMocks.gateways = [{ name: 'pesapal', type: 'redirect', label: 'PesaPal' }];
  gatewayMocks.callbacks = null;
  gatewayMocks.statusData = undefined;
  activePopup = popup();
  window.open = vi.fn(() => activePopup) as unknown as typeof window.open;
});

describe('PesapalCheckout - brutal paths', () => {
  it('renders nothing when PesaPal is not enabled', () => {
    gatewayMocks.gateways = [];
    const { container } = render(<PesapalCheckout {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('refuses to pay without an email and never touches the API', async () => {
    const user = userEvent.setup();
    render(<PesapalCheckout {...baseProps} />);

    await user.click(screen.getByRole('button', { name: /pay now/i }));

    expect(toastSpy).toHaveBeenCalledWith('error', expect.stringContaining('email'), expect.anything());
    expect(gatewayMocks.mutate).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });

  it('fails loudly when the popup is blocked and never initiates', async () => {
    const user = userEvent.setup();
    window.open = vi.fn(() => null) as unknown as typeof window.open;
    render(<PesapalCheckout {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: /pay now/i }));

    expect(toastSpy).toHaveBeenCalledWith('error', expect.stringContaining('Popup blocked'), expect.anything());
    expect(gatewayMocks.mutate).not.toHaveBeenCalled();
  });

  it('sends the full payload including target plan on initiate', async () => {
    const user = userEvent.setup();
    render(<PesapalCheckout {...baseProps} targetPlanId={9} />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'owner@example.com');
    await user.type(screen.getByPlaceholderText(/2567/i), '256771234567');
    await user.click(screen.getByRole('button', { name: /pay now/i }));

    expect(gatewayMocks.mutate).toHaveBeenCalledWith({
      gateway: 'pesapal',
      data: expect.objectContaining({
        subscription_id: 5,
        payment_type: 'subscription',
        amount: 39,
        currency: 'USD',
        email: 'owner@example.com',
        phone_number: '256771234567',
        target_plan_id: 9,
      }),
    });
  });

  it('drives the popup to the redirect URL on success', async () => {
    const user = userEvent.setup();
    render(<PesapalCheckout {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: /pay now/i }));

    gatewayMocks.callbacks?.onSuccess?.({
      data: { payment_id: 21, redirect_url: 'https://pay.example/trk-1' },
    });

    expect(activePopup?.location.href).toBe('https://pay.example/trk-1');
  });

  it('closes the popup and approves when status flips to approved', async () => {
    const user = userEvent.setup();
    const onApproved = vi.fn();
    const { rerender } = render(<PesapalCheckout {...baseProps} onApproved={onApproved} />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: /pay now/i }));
    gatewayMocks.callbacks?.onSuccess?.({
      data: { payment_id: 21, redirect_url: 'https://pay.example/trk-1' },
    });

    gatewayMocks.statusData = { data: { status: 'approved' } };
    rerender(<PesapalCheckout {...baseProps} onApproved={onApproved} />);

    await waitFor(() => expect(onApproved).toHaveBeenCalled());
    expect(activePopup?.close).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith('success', expect.stringContaining('confirmed'), expect.anything());
  });

  it('closes a blank popup in bypass mode with no redirect URL', async () => {
    const user = userEvent.setup();
    render(<PesapalCheckout {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: /pay now/i }));
    gatewayMocks.callbacks?.onSuccess?.({ data: { payment_id: 22, redirect_url: null } });

    expect(activePopup?.close).toHaveBeenCalled();
  });

  it('verify button forces a live re-check and shows pending state', async () => {
    const user = userEvent.setup();
    render(<PesapalCheckout {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: /pay now/i }));
    gatewayMocks.callbacks?.onSuccess?.({ data: { payment_id: 23, redirect_url: 'https://pay.example/x' } });

    gatewayMocks.statusData = { data: { status: 'pending' } };
    const verifyBtn = await screen.findByRole('button', { name: /verify payment/i });
    await user.click(verifyBtn);

    expect(gatewayMocks.verifyRefetch).toHaveBeenCalled();
    expect(await screen.findByText(/complete payment in the checkout window/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PesapalCheckout } from './PesapalCheckout';
import { PaymentModal } from './PaymentModal';

const toastSpy = vi.fn();

vi.mock('../../../../../app/store/contexts/toast/useToast', () => ({
  useToast: () => ({ showToast: toastSpy }),
}));

const flowState = {
  email: '',
  setEmail: vi.fn(),
  phone: '',
  setPhone: vi.fn(),
  paymentId: null as number | null,
  liveStatus: undefined as string | undefined,
  verifying: false,
  busy: false,
  popupBlocked: false,
  paymentUrl: null as string | null,
  initiating: false,
  startPayment: vi.fn(),
  verifyNow: vi.fn(),
};

vi.mock('./useGatewayCheckoutFlow', () => ({
  useGatewayCheckoutFlow: () => flowState,
}));

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
  flowState.email = '';
  flowState.phone = '';
  flowState.paymentId = null;
  flowState.liveStatus = undefined;
  flowState.popupBlocked = false;
  flowState.paymentUrl = null;
});

describe('PesapalCheckout - presentation over shared flow', () => {
  it('renders nothing extra and delegates pay to the flow', async () => {
    const user = userEvent.setup();
    render(<PesapalCheckout {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'owner@example.com');
    expect(flowState.setEmail).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /pay now/i }));
    expect(flowState.startPayment).toHaveBeenCalled();
  });

  it('shows verify only while a payment is in flight', () => {
    const { rerender } = render(<PesapalCheckout {...baseProps} />);
    expect(screen.queryByRole('button', { name: /verify payment/i })).not.toBeInTheDocument();

    flowState.paymentId = 21;
    flowState.liveStatus = 'pending';
    rerender(<PesapalCheckout {...baseProps} />);
    expect(screen.getByRole('button', { name: /verify payment/i })).toBeInTheDocument();
  });
});

describe('PaymentModal - stateful owner', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <PaymentModal theme="light" params={null} onClose={vi.fn()} onApproved={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows amount and closes only on user action or approval', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <PaymentModal
        theme="light"
        params={{ subscriptionId: 5, paymentType: 'subscription', amount: 39, currency: 'USD' }}
        onClose={onClose}
        onApproved={vi.fn()}
      />,
    );

    expect(screen.getByText(/complete payment/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the completed state instead of vanishing', () => {
    flowState.paymentId = 21;
    flowState.liveStatus = 'completed';
    render(
      <PaymentModal
        theme="light"
        params={{ subscriptionId: 5, paymentType: 'subscription', amount: 39, currency: 'USD' }}
        onClose={vi.fn()}
        onApproved={vi.fn()}
      />,
    );
    expect(screen.getByText(/payment completed/i)).toBeInTheDocument();
  });

  it('shows retry on failure instead of stranding the user', () => {
    flowState.paymentId = 21;
    flowState.liveStatus = 'failed';
    render(
      <PaymentModal
        theme="light"
        params={{ subscriptionId: 5, paymentType: 'subscription', amount: 39, currency: 'USD' }}
        onClose={vi.fn()}
        onApproved={vi.fn()}
      />,
    );
    expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import {
  getPlanAction,
  paymentStatusMeta,
  resolvePlanRelation,
  resolveSubscriptionState,
  subscriptionStatusMeta,
  PAYMENT_STATUS_MATRIX,
  SUBSCRIPTION_STATUS_MATRIX,
} from './subscriptionMatrix';
import { PaymentStatus, PaymentType, SubscriptionStatus } from '../api/subscriptions/SubscriptionTypes';

const plan = (id: number, usd: number) => ({ id, pricing: { usd } });

describe('subscriptionMatrix - status metadata', () => {
  it('covers every subscription status with label, tone and access rules', () => {
    const states = [
      SubscriptionStatus.TRIAL,
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.PAST_DUE,
      SubscriptionStatus.SUSPENDED,
      SubscriptionStatus.CANCELLED,
    ] as const;
    for (const s of states) {
      const meta = subscriptionStatusMeta(s);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
    }
    expect(SUBSCRIPTION_STATUS_MATRIX[SubscriptionStatus.PAST_DUE].needsPayment).toBe(true);
    expect(SUBSCRIPTION_STATUS_MATRIX[SubscriptionStatus.SUSPENDED].grantsAccess).toBe(false);
    expect(SUBSCRIPTION_STATUS_MATRIX[SubscriptionStatus.ACTIVE].needsPayment).toBe(false);
  });

  it('covers every payment status with terminal and re-payment rules', () => {
    expect(PAYMENT_STATUS_MATRIX[PaymentStatus.PENDING].allowsNewPayment).toBe(false);
    expect(PAYMENT_STATUS_MATRIX[PaymentStatus.PENDING].isTerminal).toBe(false);
    expect(PAYMENT_STATUS_MATRIX[PaymentStatus.COMPLETED].allowsNewPayment).toBe(true);
    expect(PAYMENT_STATUS_MATRIX[PaymentStatus.FAILED].allowsNewPayment).toBe(true);
    expect(PAYMENT_STATUS_MATRIX[PaymentStatus.REFUNDED].isTerminal).toBe(true);
    expect(paymentStatusMeta(PaymentStatus.COMPLETED).label).toBe('Completed');
    expect(paymentStatusMeta(PaymentStatus.FAILED).label).toBe('Failed');
  });

  it('falls back safely for unknown statuses instead of crashing', () => {
    expect(subscriptionStatusMeta('weird').label).toBe('weird');
    expect(paymentStatusMeta('weird').allowsNewPayment).toBe(true);
  });
});

describe('subscriptionMatrix - plan actions', () => {
  it('resolves state from subscription, none without one', () => {
    expect(resolveSubscriptionState(null)).toBe('none');
    expect(resolveSubscriptionState(undefined)).toBe('none');
    expect(resolveSubscriptionState({ status: SubscriptionStatus.SUSPENDED } as never)).toBe('suspended');
  });

  it('resolves plan relation by price with current winning ties', () => {
    expect(resolvePlanRelation(plan(2, 99), 2, 99)).toBe('current');
    expect(resolvePlanRelation(plan(3, 199), 2, 99)).toBe('higher');
    expect(resolvePlanRelation(plan(1, 19), 2, 99)).toBe('lower');
    expect(resolvePlanRelation(plan(3, 199), null, 0)).toBe('current');
  });

  it('past_due and suspended always reactivate with renewal payment', () => {
    for (const status of [SubscriptionStatus.PAST_DUE, SubscriptionStatus.SUSPENDED]) {
      for (const rel of ['current', 'higher', 'lower'] as const) {
        const action = getPlanAction(
          { status } as never,
          plan(9, 199),
          rel === 'current' ? 9 : 2,
          rel === 'current' ? 199 : 39,
        );
        expect(action.type).toBe('reactivate');
        expect(action.requiresPayment).toBe(true);
        expect(action.paymentType).toBe(PaymentType.RENEWAL);
      }
    }
  });

  it('active upgrades pay proration, downgrades schedule free', () => {
    const up = getPlanAction({ status: SubscriptionStatus.ACTIVE } as never, plan(9, 199), 2, 39);
    expect(up.type).toBe('upgrade_now');
    expect(up.paymentType).toBe(PaymentType.UPGRADE_PRORATION);

    const down = getPlanAction({ status: SubscriptionStatus.ACTIVE } as never, plan(1, 19), 2, 39);
    expect(down.type).toBe('schedule_downgrade');
    expect(down.requiresPayment).toBe(false);
  });

  it('cancelled resubscribes on current, subscribes elsewhere', () => {
    const sub = { status: SubscriptionStatus.CANCELLED } as never;
    expect(getPlanAction(sub, plan(2, 39), 2, 39).type).toBe('resubscribe');
    expect(getPlanAction(sub, plan(9, 199), 2, 39).type).toBe('subscribe');
  });
});

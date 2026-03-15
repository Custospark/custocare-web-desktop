import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  CreditCard,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Lock,
  Clock,
  Award,
  Database,
  Layers,
  RefreshCw,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useGetPlans, useCreateSubscription, useGetFacilitySubscription } from '../../api/subscriptions/SubscriptionQueries';
import type { Plan } from '../../api/subscriptions/SubscriptionTypes';
import { cn } from '../../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AvailablePlansProps {
  theme: 'light' | 'dark';
  redirectUrl?: string; // Placeholder for subscription page URL
}

// interface PlanFeature {
//   name: string;
//   included: boolean;
//   limit?: string | number;
//   tooltip?: string;
// }


// ─── Plan Comparison Modal ────────────────────────────────────────────────────
// ─── Plan Comparison Modal ────────────────────────────────────────────────────
interface ComparisonModalProps {
  theme: 'light' | 'dark';
  plans: Plan[];
  onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ theme, plans, onClose }) => {
  const isDark = theme === 'dark';

  // Organize features by category for comparison
  const featureCategories: Record<string, { name: string; icon: React.ElementType; features: string[] }> = {
    limits: {
      name: 'Capacity Limits',
      icon: Database,
      features: ['max_staff', 'max_departments', 'max_patients_per_month'],
    },
    billing: {
      name: 'Billing & Pricing',
      icon: CreditCard,
      features: ['pricing', 'onboarding_fee', 'trial_days'],
    },
    features: {
      name: 'Platform Features',
      icon: Layers,
      features: Object.keys(plans[0]?.features || {}).slice(0, 8),
    },
  };

  const formatFeatureName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/max_/g, '')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFeatureValue = (plan: Plan, feature: string): string => {
    if (feature === 'pricing') {
      return `${plan.pricing.ugx.toLocaleString()} UGX / ${plan.pricing.billing_cycle}`;
    }
    if (feature === 'onboarding_fee') {
      return plan.onboarding_fee.applicable
        ? `${plan.onboarding_fee.ugx.toLocaleString()} UGX`
        : 'No fee';
    }
    if (feature === 'trial_days') {
      return `${plan.trial_days} days`;
    }
    if (feature.startsWith('max_')) {
      const value = plan.limits[feature as keyof typeof plan.limits];
      return value === null ? 'Unlimited' : value.toString();
    }
    if (plan.features && feature in plan.features) {
      const val = plan.features[feature];
      return val === true ? '✓' : val === false ? '—' : String(val);
    }
    return '—';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative rounded-2xl max-w-6xl w-full my-8 border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}
      >
        {/* Header - Changed from sticky to relative */}
        <div className={cn(
          'relative flex items-center justify-between p-6 border-b rounded-t-2xl',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-xl',
              isDark ? 'bg-blue-500/20' : 'bg-blue-100'
            )}>
              <Layers className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
            </div>
            <h2 className="text-xl font-bold">Compare Plans</h2>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table - Added max-height and overflow */}
        <div className="p-6 overflow-x-auto" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          <table className="w-full">
            <thead className={cn(
              'sticky top-0 z-10',
              isDark ? 'bg-gray-900' : 'bg-white'
            )}>
              <tr>
                <th className="text-left pb-4 min-w-[200px]">
                  <span className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Feature
                  </span>
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-4 pb-4 min-w-[180px]">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold">{plan.name}</span>
                        {plan.is_popular && (
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                          )}>
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold">
                        {plan.pricing.ugx.toLocaleString()} UGX
                        <span className={cn('text-sm font-normal ml-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                          /{plan.pricing.billing_cycle}
                        </span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-gray-800' : 'divide-gray-200')}>
              {Object.entries(featureCategories).map(([categoryKey, category]) => (
                <React.Fragment key={categoryKey}>
                  {/* Category Header */}
                  <tr>
                    <td colSpan={plans.length + 1} className="pt-6 pb-2">
                      <div className="flex items-center gap-2">
                        <category.icon className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                        <span className={cn('font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
                          {category.name}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Features */}
                  {category.features.map((feature) => (
                    <tr key={feature} className={cn(
                      'hover:bg-opacity-50',
                      isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    )}>
                      <td className="py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{formatFeatureName(feature)}</span>
                          <HelpCircle className={cn(
                            'w-3.5 h-3.5 cursor-help',
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          )} />
                        </div>
                      </td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3">
                          <span className={cn(
                            'text-sm',
                            formatFeatureValue(plan, feature) === '✓'
                              ? isDark ? 'text-green-400' : 'text-green-600'
                              : isDark ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            {formatFeatureValue(plan, feature)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={cn(
          'p-6 border-t flex justify-end sticky bottom-0',
          isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        )}>
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg font-medium',
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
// ─── Plan Card ───────────────────────────────────────────────────────────────
interface PlanCardProps {
  theme: 'light' | 'dark';
  plan: Plan;
  isCurrentPlan: boolean;
  hasActiveSubscription: boolean;
  onSubscribe: (planId: number) => void;
  isSubscribing: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  theme,
  plan,
  isCurrentPlan,
  hasActiveSubscription,
  onSubscribe,
  isSubscribing,
}) => {
  const isDark = theme === 'dark';

  // Extract feature flags for display
  const features = [
    { name: 'Staff Accounts', value: plan.limits.max_staff === null ? 'Unlimited' : `Up to ${plan.limits.max_staff}` },
    { name: 'Departments', value: plan.limits.max_departments === null ? 'Unlimited' : `Up to ${plan.limits.max_departments}` },
    { name: 'Patients/Month', value: plan.limits.max_patients_per_month === null ? 'Unlimited' : `Up to ${plan.limits.max_patients_per_month}` },
    { name: 'Trial Period', value: `${plan.trial_days} days` },
    { name: 'Onboarding Fee', value: plan.onboarding_fee.applicable ? `${plan.onboarding_fee.ugx.toLocaleString()} UGX` : 'No fee' },
  ];

  // Add feature flags from the features object
  if (plan.features) {
    Object.entries(plan.features).slice(0, 4).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        features.push({ name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: '✓' });
      }
    });
  }

  const handleSubscribe = () => {
    onSubscribe(plan.id);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'relative rounded-2xl border transition-all duration-300',
        plan.is_popular
          ? isDark
            ? 'border-purple-500/50 shadow-lg shadow-purple-500/20'
            : 'border-purple-200 shadow-xl shadow-purple-500/10'
          : isDark
            ? 'border-gray-800 hover:border-gray-700'
            : 'border-gray-200 hover:border-gray-300',
        isCurrentPlan && (isDark ? 'ring-2 ring-green-500' : 'ring-2 ring-green-400')
      )}
    >
      {/* Popular Badge */}
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
            isDark
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
          )}>
            <Sparkles className="w-3 h-3" />
            Most Popular
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
            isDark
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
          )}>
            <CheckCircle className="w-3 h-3" />
            Current Plan
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
          {plan.description && (
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {plan.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">{plan.pricing.ugx.toLocaleString()}</span>
            <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
              UGX / {plan.pricing.billing_cycle}
            </span>
          </div>
          {plan.onboarding_fee.applicable && (
            <div className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
              + {plan.onboarding_fee.ugx.toLocaleString()} UGX one-time setup
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className={cn(
                'w-4 h-4 mt-0.5 flex-shrink-0',
                feature.value === '✓' || !feature.value.toString().includes('No')
                  ? isDark ? 'text-green-400' : 'text-green-500'
                  : isDark ? 'text-gray-600' : 'text-gray-400'
              )} />
              <div className="flex-1 text-sm">
                <span className={cn(
                  'font-medium',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {feature.name}:
                </span>{' '}
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubscribe}
          disabled={isCurrentPlan || hasActiveSubscription || isSubscribing}
          className={cn(
            'w-full py-3 rounded-xl font-medium transition-all',
            'flex items-center justify-center gap-2',
            isCurrentPlan || hasActiveSubscription
              ? isDark
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30',
            'transform hover:-translate-y-0.5',
            isSubscribing && 'opacity-70 cursor-wait'
          )}
        >
          {isSubscribing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Current Plan
            </>
          ) : hasActiveSubscription ? (
            <>
              <Lock className="w-4 h-4" />
              Already Subscribed
            </>
          ) : (
            <>
              Subscribe Now
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Trial Info */}
        {plan.trial_days > 0 && !isCurrentPlan && (
          <div className={cn(
            'mt-3 text-xs text-center flex items-center justify-center gap-1',
            isDark ? 'text-gray-500' : 'text-gray-500'
          )}>
            <Clock className="w-3 h-3" />
            {plan.trial_days}-day free trial included
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const AvailablePlans: React.FC<AvailablePlansProps> = ({
  theme,
  redirectUrl = ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS, // Default placeholder
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  // State
  const [showComparison, setShowComparison] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);

  // Queries
  const { data: plansResponse, isLoading, error, refetch } = useGetPlans();
  const { data: currentSubscriptionResponse } = useGetFacilitySubscription();
  const createSubscription = useCreateSubscription({
    onSuccess: () => {
      setSubscribingPlanId(null);
      // Navigate to subscription page
      navigate(redirectUrl);
    },
    onError: () => {
      setSubscribingPlanId(null);
    },
  });

  const plans = plansResponse?.data || [];
  const currentSubscription = currentSubscriptionResponse?.data;
  const hasActiveSubscription = currentSubscription?.has_access || false;
  const currentPlanId = currentSubscription?.plan?.id;

  // Handlers
  const handleSubscribe = async (planId: number) => {
    if (hasActiveSubscription) {
      await confirm({
        title: 'Active Subscription Found',
        message: 'You already have an active subscription. Would you like to switch plans?',
        confirmText: 'Switch Plan',
        cancelText: 'Cancel',
        variant: 'info',
        theme,
      });
      navigate(redirectUrl);
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Subscription',
      message: 'You are about to subscribe to this plan. You will be directed to complete your payment.',
      confirmText: 'Proceed to Payment',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!confirmed) return;

    setSubscribingPlanId(planId);
    createSubscription.mutate({ data: { plan_id: planId } });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading available plans..." />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={cn(
        'rounded-2xl p-10 text-center border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className={cn(
          'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
          isDark ? 'bg-red-900/30' : 'bg-red-100'
        )}>
          <X className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
        </div>
        <h3 className="text-lg font-bold mb-2">Failed to Load Plans</h3>
        <p className={cn('mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {error.message || 'Unable to fetch subscription plans. Please try again.'}
        </p>
        <button
          onClick={() => refetch()}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Empty State
  if (plans.length === 0) {
    return (
      <div className={cn(
        'rounded-2xl p-10 text-center border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className={cn(
          'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        )}>
          <CreditCard className={cn('w-8 h-8', isDark ? 'text-gray-600' : 'text-gray-400')} />
        </div>
        <h3 className="text-lg font-bold mb-2">No Plans Available</h3>
        <p className={cn('mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
          No subscription plans are currently available. Please check back later.
        </p>
      </div>
    );
  }

  // Sort plans: popular first, then by sort_order
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.is_popular && !b.is_popular) return -1;
    if (!a.is_popular && b.is_popular) return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Choose Your Plan</h1>
          <p className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>
            Select the perfect plan for your facility's needs
          </p>
        </div>
        <button
          onClick={() => setShowComparison(true)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
            'border transition-all',
            isDark
              ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
              : 'border-gray-200 text-gray-700 hover:bg-gray-100'
          )}
        >
          <Layers className="w-4 h-4" />
          Compare Plans
        </button>
      </div>

      {/* Current Subscription Banner */}
      {hasActiveSubscription && currentSubscription && (
        <div className={cn(
          'rounded-xl p-4 border flex items-start gap-3',
          isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
        )}>
          <CheckCircle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-green-400' : 'text-green-600')} />
          <div className="flex-1">
            <p className="font-medium">Active Subscription</p>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              You are currently subscribed to {currentSubscription.plan?.name || 'a plan'}. 
              Your subscription {currentSubscription.status_label.toLowerCase()}.
              {currentSubscription.next_billing_date && ` Next billing: ${new Date(currentSubscription.next_billing_date).toLocaleDateString()}`}
            </p>
          </div>
          <button
            onClick={() => navigate(redirectUrl)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              isDark
                ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                : 'bg-green-200 text-green-700 hover:bg-green-300'
            )}
          >
            Manage Subscription
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            theme={theme}
            plan={plan}
            isCurrentPlan={plan.id === currentPlanId}
            hasActiveSubscription={hasActiveSubscription}
            onSubscribe={handleSubscribe}
            isSubscribing={subscribingPlanId === plan.id && createSubscription.isPending}
          />
        ))}
      </div>

      {/* Trust Indicators */}
      <div className={cn(
        'grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-xl border',
        isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isDark ? 'bg-blue-900/30' : 'bg-blue-100'
          )}>
            <Lock className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
          </div>
          <div>
            <p className="font-medium text-sm">Secure Payments</p>
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
              Encrypted & PCI compliant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isDark ? 'bg-green-900/30' : 'bg-green-100'
          )}>
            <RefreshCw className={cn('w-5 h-5', isDark ? 'text-green-400' : 'text-green-600')} />
          </div>
          <div>
            <p className="font-medium text-sm">Cancel Anytime</p>
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
              No long-term contracts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isDark ? 'bg-purple-900/30' : 'bg-purple-100'
          )}>
            <Award className={cn('w-5 h-5', isDark ? 'text-purple-400' : 'text-purple-600')} />
          </div>
          <div>
            <p className="font-medium text-sm">24/7 Support</p>
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
              Enterprise-grade assistance
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
          <ComparisonModal
            theme={theme}
            plans={sortedPlans}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvailablePlans;
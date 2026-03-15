/**
 * ============================================================================
 * SUBSCRIPTION COMPONENT - SHOW CURRENT PLAN & UPGRADE OPTIONS
 * ============================================================================
 *
 * Shows the user's current subscription plan from the API
 * Dropdown displays plan details, features, and upgrade options
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Settings,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../types/cn';
import { useNavigate } from 'react-router-dom';

// Import subscription hooks and types
import {
  useGetFacilitySubscription,
  useGetPlans,
} from '../../../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import {
  type Subscription,
  type Plan,
  SubscriptionStatus,
} from '../../../../modules/administration/admin-module/api/subscriptions/SubscriptionTypes';

// Import route constants
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../app/routes/constants/administration.paths';

interface SubscriptionProps {
  isDark: boolean;
  isMobile: boolean;
  className?: string;
  onUpgradeClick?: (planId: number) => void;
  onManageClick?: () => void;
}

interface PlanConfig {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  ringColor: string;
  textColor: string;
  hoverBg: string;
  features: string[];
  price: string;
  badge?: {
    text: string;
    color: string;
  };
  isCurrent?: boolean;
}

// Helper to get plan icon based on name/features
const getPlanIcon = (planName: string, isPopular?: boolean) => {
  const name = planName.toLowerCase();
  if (name.includes('essential') || name.includes('basic')) {
    return <Crown className="w-3.5 h-3.5" />;
  }
  if (name.includes('professional') || name.includes('pro') || isPopular) {
    return <Sparkles className="w-3.5 h-3.5" />;
  }
  if (name.includes('enterprise') || name.includes('premium')) {
    return <Building2 className="w-3.5 h-3.5" />;
  }
  return <Crown className="w-3.5 h-3.5" />;
};

// Helper to get plan colors based on name or popularity
const getPlanColors = (planName: string, isPopular?: boolean, isDark?: boolean) => {
  const name = planName.toLowerCase();
  
  if (name.includes('essential') || name.includes('basic')) {
    return {
      color: isDark ? 'text-emerald-400' : 'text-emerald-700',
      bgColor: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
      ringColor: isDark ? 'ring-emerald-500/60' : 'ring-emerald-600/70',
      textColor: isDark ? 'text-emerald-400' : 'text-emerald-700',
      hoverBg: isDark ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-100/70',
    };
  }
  
  if (name.includes('professional') || name.includes('pro') || isPopular) {
    return {
      color: isDark ? 'text-blue-400' : 'text-blue-700',
      bgColor: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
      ringColor: isDark ? 'ring-blue-500/60' : 'ring-blue-600/70',
      textColor: isDark ? 'text-blue-400' : 'text-blue-700',
      hoverBg: isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100/70',
    };
  }
  
  if (name.includes('enterprise') || name.includes('premium')) {
    return {
      color: isDark ? 'text-purple-400' : 'text-purple-700',
      bgColor: isDark ? 'bg-purple-500/15' : 'bg-purple-50',
      ringColor: isDark ? 'ring-purple-500/60' : 'ring-purple-600/70',
      textColor: isDark ? 'text-purple-400' : 'text-purple-700',
      hoverBg: isDark ? 'hover:bg-purple-500/10' : 'hover:bg-purple-100/70',
    };
  }
  
  // Default colors
  return {
    color: isDark ? 'text-gray-400' : 'text-gray-700',
    bgColor: isDark ? 'bg-gray-700/50' : 'bg-gray-100',
    ringColor: isDark ? 'ring-gray-600' : 'ring-gray-400',
    textColor: isDark ? 'text-gray-400' : 'text-gray-700',
    hoverBg: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
  };
};

// Extract features from plan limits and features object
const extractPlanFeatures = (plan: Plan): string[] => {
  const features: string[] = [];

  // Add limit-based features
  if (plan.limits.max_staff !== null) {
    features.push(`Up to ${plan.limits.max_staff} staff members`);
  } else {
    features.push('Unlimited staff members');
  }

  if (plan.limits.max_departments !== null) {
    features.push(`Up to ${plan.limits.max_departments} departments`);
  } else {
    features.push('Unlimited departments');
  }

  if (plan.limits.max_patients_per_month !== null) {
    features.push(`Up to ${plan.limits.max_patients_per_month} patients/month`);
  } else {
    features.push('Unlimited patients per month');
  }

  // Add trial info
  if (plan.trial_days > 0) {
    features.push(`${plan.trial_days}-day free trial`);
  }

  // Add feature flags from the features object
  if (plan.features) {
    Object.entries(plan.features).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        features.push(formattedKey);
      } else if (typeof value === 'string' && value) {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        features.push(`${formattedKey}: ${value}`);
      }
    });
  }

  return features;
};

export const Subscription: React.FC<SubscriptionProps> = ({
  isDark,
  isMobile,
  className,
  onUpgradeClick,
  onManageClick,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Use state instead of ref for plan configs
  const [currentPlanConfig, setCurrentPlanConfig] = useState<PlanConfig | null>(null);
  const [otherPlans, setOtherPlans] = useState<PlanConfig[]>([]);

  // Fetch real subscription data
  const {
    data: subscriptionResponse,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useGetFacilitySubscription();

  // Fetch available plans for upgrade options
  const {
    data: plansResponse,
    isLoading: plansLoading,
  } = useGetPlans();

  const subscription = subscriptionResponse?.data;
  const currentPlan = subscription?.plan;
  const plans = plansResponse?.data || [];

  // Determine if subscription is active/has access
  const hasActiveSubscription = subscription?.has_access || false;
  const isInTrial = subscription?.status === SubscriptionStatus.TRIAL;

  // Update current plan config when data changes
  useEffect(() => {
    if (currentPlan) {
      const colors = getPlanColors(currentPlan.name, currentPlan.is_popular, isDark);
      const features = extractPlanFeatures(currentPlan);
      
      setCurrentPlanConfig({
        id: currentPlan.id,
        name: currentPlan.name,
        icon: getPlanIcon(currentPlan.name, currentPlan.is_popular),
        ...colors,
        features: features.slice(0, 8), // Show up to 8 features
        price: `${currentPlan.pricing.ugx.toLocaleString()} UGX/${currentPlan.pricing.billing_cycle}`,
        badge: hasActiveSubscription ? {
          text: isInTrial ? 'Trial' : 'Active',
          color: colors.color,
        } : undefined,
        isCurrent: true,
      });
    } else {
      setCurrentPlanConfig(null);
    }
  }, [currentPlan, isDark, hasActiveSubscription, isInTrial]);

  // Update other plans when data changes
  useEffect(() => {
    if (plans.length > 0 && currentPlan) {
      const filteredPlans = plans
        .filter(plan => plan.id !== currentPlan.id && plan.is_active)
        .map(plan => {
          const colors = getPlanColors(plan.name, plan.is_popular, isDark);
          const features = extractPlanFeatures(plan);
          
          return {
            id: plan.id,
            name: plan.name,
            icon: getPlanIcon(plan.name, plan.is_popular),
            ...colors,
            features: features.slice(0, 2), // Show first 2 features in upgrade cards
            price: `${plan.pricing.ugx.toLocaleString()} UGX/${plan.pricing.billing_cycle}`,
            badge: plan.is_popular ? {
              text: 'Popular',
              color: isDark ? 'text-purple-400' : 'text-purple-600',
            } : undefined,
            isCurrent: false,
          };
        })
        .slice(0, 3); // Show max 3 upgrade options
      
      setOtherPlans(filteredPlans);
    } else {
      setOtherPlans([]);
    }
  }, [plans, currentPlan, isDark]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleUpgrade = (planId: number) => {
    if (onUpgradeClick) {
      onUpgradeClick(planId);
    } else {
      // Default navigation to plans page
      navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS);
    }
    setIsDropdownOpen(false);
  };

  const handleManageBilling = () => {
    if (onManageClick) {
      onManageClick();
    } else {
      // Default navigation to subscription management
      navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS);
    }
    setIsDropdownOpen(false);
  };

  const handleViewAllPlans = () => {
    navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS);
    setIsDropdownOpen(false);
  };

  // Combined loading state
  const isLoading = subscriptionLoading || plansLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('relative', className)}>
        <button
          disabled
          className={cn(
            'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'transition-all duration-200',
            'ring-1 ring-gray-300 dark:ring-gray-700',
            isDark ? 'bg-gray-800/40' : 'bg-gray-100',
            'opacity-70 cursor-wait'
          )}
        >
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full',
            'ring-1 ring-offset-1 ring-gray-300 dark:ring-gray-600',
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          )}>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
          </div>
          <div className="hidden lg:flex flex-col items-start min-w-0">
            <span className={cn('text-xs font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Loading...
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Error state or no subscription
  if (subscriptionError || !subscription || !currentPlan) {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
          className={cn(
            'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'transition-all duration-200 cursor-pointer',
            'ring-1 ring-amber-500/50',
            isDark ? 'bg-amber-900/20 hover:bg-amber-900/30' : 'bg-amber-50 hover:bg-amber-100',
            'hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full',
            'ring-1 ring-offset-1 ring-amber-500/50',
            isDark ? 'bg-amber-900/30' : 'bg-amber-100'
          )}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="hidden lg:flex flex-col items-start min-w-0">
            <span className={cn('text-xs font-semibold', isDark ? 'text-amber-400' : 'text-amber-700')}>
              Choose a Plan
            </span>
            <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Get started today
            </span>
          </div>
          <ChevronDown className="hidden lg:block w-3 h-3 ml-auto text-amber-500" />
        </button>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={handleToggle}
        aria-label="View subscription plan"
        aria-expanded={isDropdownOpen}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-all duration-200 cursor-pointer',
          'ring-1',
          currentPlanConfig?.ringColor,
          isDark ? 'bg-gray-800/40 hover:bg-gray-800/70' : 'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          'hover:scale-[1.02] active:scale-[0.98]'
        )}
      >
        <div
          className={cn(
            'relative flex items-center justify-center w-7 h-7 rounded-full',
            'ring-1 ring-offset-1',
            currentPlanConfig?.ringColor,
            currentPlanConfig?.bgColor,
            isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
          )}
        >
          <div className={currentPlanConfig?.textColor}>
            {currentPlanConfig?.icon}
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn('text-xs font-semibold truncate', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {currentPlan.name}
            {isInTrial && <span className="ml-1 text-amber-500">(Trial)</span>}
          </span>
          <span className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {currentPlanConfig?.price}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'hidden lg:block w-3 h-3 ml-auto transition-transform duration-200',
            isDark ? 'text-gray-400' : 'text-gray-500',
            isDropdownOpen && 'rotate-180'
          )}
        />
      </button>

      {isDropdownOpen && (
        <div
          className={cn(
            'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
            isMobile
              ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md'
              : 'absolute right-0 mt-2 w-80',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          )}
        >
          {/* Current Plan Header */}
          <div className={cn('px-4 py-3 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full',
                  'ring-2',
                  currentPlanConfig?.ringColor,
                  currentPlanConfig?.bgColor
                )}
              >
                {currentPlanConfig?.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={cn('text-sm font-bold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                    {currentPlan.name}
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-bold rounded-full',
                      currentPlanConfig?.bgColor,
                      currentPlanConfig?.color
                    )}
                  >
                    {isInTrial ? 'Trial' : 'Active'}
                  </span>
                </div>
                <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {currentPlanConfig?.price}
                </p>
              </div>
            </div>

            {/* Current Plan Features */}
            <div className="mt-3 space-y-2">
              <h4 className={cn('text-xs font-semibold', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Included in your plan:
              </h4>
              <div className="space-y-1.5">
                {currentPlanConfig?.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', currentPlanConfig?.color)} />
                    <span className={cn('text-xs', isDark ? 'text-gray-300' : 'text-gray-600')}>
                      {feature}
                    </span>
                  </div>
                ))}
                {currentPlanConfig && currentPlanConfig.features.length > 4 && (
                  <p className={cn('text-xs pl-5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    +{currentPlanConfig.features.length - 4} more features
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade Options */}
          {otherPlans.length > 0 && (
            <div className={cn('px-3 py-2 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <p className={cn('text-xs font-medium mb-2 px-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Upgrade your plan
              </p>
              <div className="space-y-1">
                {otherPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-md',
                      'transition-all duration-150 cursor-pointer',
                      'focus:outline-none focus:ring-1 focus:ring-inset',
                      isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/30',
                      plan.hoverBg,
                      'hover:scale-[1.01] active:scale-[0.99]',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full',
                        'ring-1',
                        plan.ringColor,
                        plan.bgColor
                      )}
                    >
                      <div className={cn('w-4 h-4', plan.textColor)}>
                        {plan.icon}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{plan.name}</span>
                        <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                          {plan.price}
                        </span>
                      </div>
                      <p className={cn('text-xs line-clamp-1', isDark ? 'text-gray-500' : 'text-gray-600')}>
                        {plan.features[0]} • {plan.features[1]}
                      </p>
                    </div>
                    {plan.badge && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={cn('p-2 space-y-1', isDark ? 'bg-gray-800/20' : 'bg-gray-50/50')}>
            <button
              onClick={handleManageBilling}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                'transition-colors cursor-pointer',
                isDark
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700',
                'focus:outline-none focus:ring-1 focus:ring-inset',
                isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/30'
              )}
            >
              <CreditCard className="w-4 h-4" />
              <span>Manage billing</span>
            </button>
            
            <button
              onClick={handleViewAllPlans}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                'transition-colors cursor-pointer',
                isDark
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700',
                'focus:outline-none focus:ring-1 focus:ring-inset',
                isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/30'
              )}
            >
              <Settings className="w-4 h-4" />
              <span>View all plans</span>
            </button>

            <button
              onClick={() => {
                navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS);
                setIsDropdownOpen(false);
              }}
              className={cn(
                'flex items-center justify-center gap-1 px-3 py-2 text-xs w-full',
                'transition-colors',
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Compare all features
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Footer */}
          <div className={cn('px-4 py-2 border-t text-center', isDark ? 'border-gray-800 bg-gray-800/20' : 'border-gray-200 bg-gray-50/50')}>
            <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Need help? Contact our support team
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Subscription);
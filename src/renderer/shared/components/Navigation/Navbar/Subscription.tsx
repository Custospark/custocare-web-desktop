/**
 * ============================================================================
 * SUBSCRIPTION COMPONENT - SHOW CURRENT PLAN & UPGRADE OPTIONS
 * ============================================================================
 *
 * Shows the user's current subscription plan (Essential, Professional, Enterprise)
 * Provides option to upgrade and manage subscription
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  CreditCard,
  ChevronDown,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../types/cn';

interface SubscriptionProps {
  isDark: boolean;
  isMobile: boolean;
  className?: string;
  currentPlan?: 'essential' | 'professional' | 'enterprise';
}

interface PlanDetails {
  id: 'essential' | 'professional' | 'enterprise';
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  ringColor: string;
  textColor: string;
  features: string[];
  price: string;
}

export const Subscription: React.FC<SubscriptionProps> = ({
  isDark,
  isMobile,
  className,
  currentPlan = 'essential', // Default to essential
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const plans: Record<string, PlanDetails> = {
    essential: {
      id: 'essential',
      name: 'Essential',
      icon: <Shield className="w-3.5 h-3.5" />,
      color: isDark ? 'text-emerald-400' : 'text-emerald-700',
      bgColor: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
      ringColor: isDark ? 'ring-emerald-500/60' : 'ring-emerald-600/70',
      textColor: isDark ? 'text-emerald-400' : 'text-emerald-700',
      features: ['Basic dashboard', 'Patient management', 'Up to 5 staff'],
      price: 'Free',
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      icon: <Zap className="w-3.5 h-3.5" />,
      color: isDark ? 'text-blue-400' : 'text-blue-700',
      bgColor: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
      ringColor: isDark ? 'ring-blue-500/60' : 'ring-blue-600/70',
      textColor: isDark ? 'text-blue-400' : 'text-blue-700',
      features: ['Advanced analytics', 'Staff scheduling', 'Up to 20 staff', 'Priority support'],
      price: '$49/month',
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: isDark ? 'text-purple-400' : 'text-purple-700',
      bgColor: isDark ? 'bg-purple-500/15' : 'bg-purple-50',
      ringColor: isDark ? 'ring-purple-500/60' : 'ring-purple-600/70',
      textColor: isDark ? 'text-purple-400' : 'text-purple-700',
      features: [
        'Unlimited staff',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Advanced security',
      ],
      price: 'Custom',
    },
  };

  const currentPlanDetails = plans[currentPlan] || plans.essential;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpgrade = (planId: string) => {
    // TODO: Implement upgrade flow
    console.log('Upgrade to:', planId);
    setIsDropdownOpen(false);
  };

  const handleManageBilling = () => {
    // TODO: Navigate to billing page
    console.log('Manage billing');
    setIsDropdownOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="Manage subscription"
        aria-expanded={isDropdownOpen}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-all duration-200 cursor-pointer',
          'ring-1',
          currentPlanDetails.ringColor,
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
            currentPlanDetails.ringColor,
            currentPlanDetails.bgColor,
            isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
          )}
        >
          <div className={currentPlanDetails.color}>{currentPlanDetails.icon}</div>
        </div>

        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn('text-xs font-semibold truncate', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {currentPlanDetails.name} Plan
          </span>
          <span className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {currentPlanDetails.price}
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
          {/* Header */}
          <div className={cn('px-4 py-3 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <div className="flex items-center justify-between mb-1">
              <h3 className={cn('text-sm font-bold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                Subscription Plan
              </h3>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-bold rounded-full',
                  currentPlanDetails.bgColor,
                  currentPlanDetails.color
                )}
              >
                {currentPlanDetails.name}
              </span>
            </div>
            <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {currentPlanDetails.price} • {currentPlanDetails.features.length} features included
            </p>
          </div>

          {/* Current Plan Features */}
          <div className={cn('px-4 py-3 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <h4 className={cn('text-xs font-semibold mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
              Current Plan Features:
            </h4>
            <ul className="space-y-1.5">
              {currentPlanDetails.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', currentPlanDetails.color)} />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Available Plans */}
          <div className="p-2 space-y-1">
            {Object.values(plans).map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;

              return (
                <button
                  key={plan.id}
                  onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                  disabled={isCurrentPlan}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg',
                    'transition-all duration-150',
                    'hover:scale-[1.01] active:scale-[0.99]',
                    isCurrentPlan
                      ? isDark
                        ? 'bg-blue-500/10 ring-1 ring-blue-500/30'
                        : 'bg-blue-50 ring-1 ring-blue-200'
                      : cn(
                          'cursor-pointer',
                          isDark
                            ? 'hover:bg-gray-800/60 bg-gray-800/20'
                            : 'hover:bg-gray-100 bg-gray-50/50'
                        ),
                    isCurrentPlan && 'cursor-default'
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
                    <div className={plan.color}>{plan.icon}</div>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-900')}>
                        {plan.name}
                      </span>
                      <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {plan.price}
                      </span>
                    </div>
                    <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {plan.features.slice(0, 2).join(' • ')}
                      {plan.features.length > 2 && ' • ...'}
                    </p>
                  </div>

                  {isCurrentPlan && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className={cn('p-3 border-t space-y-2', isDark ? 'border-gray-800 bg-gray-800/20' : 'border-gray-200 bg-gray-50/50')}>
            <button
              onClick={handleManageBilling}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                'bg-gradient-to-r from-blue-600 to-emerald-600 text-white',
                'hover:from-blue-700 hover:to-emerald-700',
                'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isDark ? 'focus:ring-blue-500/50 focus:ring-offset-gray-900' : 'focus:ring-blue-500/30 focus:ring-offset-white'
              )}
            >
              <CreditCard className="w-4 h-4" />
              Manage Billing
            </button>

            <a
              href="#"
              className={cn(
                'flex items-center justify-center gap-1 text-xs',
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Compare all features
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Subscription);
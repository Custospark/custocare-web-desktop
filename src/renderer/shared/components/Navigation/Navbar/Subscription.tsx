/**
 * ============================================================================
 * SUBSCRIPTION COMPONENT - SHOW CURRENT PLAN & UPGRADE OPTIONS
 * ============================================================================
 *
 * Shows the user's current subscription plan (Essential, Professional, Enterprise)
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
} from 'lucide-react';
import { cn } from '../../../types/cn'; // Using the correct import path from your Navbar

interface SubscriptionProps {
  isDark: boolean;
  isMobile: boolean;
  className?: string;
  currentPlan?: 'essential' | 'professional' | 'enterprise';
  onUpgradeClick?: (plan: string) => void;
  onManageClick?: () => void;
}

interface PlanConfig {
  id: 'essential' | 'professional' | 'enterprise';
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
}

export const Subscription: React.FC<SubscriptionProps> = ({
  isDark,
  isMobile,
  className,
  currentPlan = 'essential',
  onUpgradeClick,
  onManageClick,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const planConfigs: Record<string, PlanConfig> = {
    essential: {
      id: 'essential',
      name: 'Essential',
      icon: <Crown className="w-3.5 h-3.5" />,
      color: isDark ? 'text-emerald-400' : 'text-emerald-700',
      bgColor: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
      ringColor: isDark ? 'ring-emerald-500/60' : 'ring-emerald-600/70',
      textColor: isDark ? 'text-emerald-400' : 'text-emerald-700',
      hoverBg: isDark ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-100/70',
      features: [
        'Basic dashboard',
        'Patient management',
        'Up to 5 staff members',
        '24/7 email support',
        '5GB storage',
      ],
      price: 'USD 20/Month',
      badge: {
        text: 'Current',
        color: 'text-emerald-500',
      },
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: isDark ? 'text-blue-400' : 'text-blue-700',
      bgColor: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
      ringColor: isDark ? 'ring-blue-500/60' : 'ring-blue-600/70',
      textColor: isDark ? 'text-blue-400' : 'text-blue-700',
      hoverBg: isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100/70',
      features: [
        'Advanced analytics',
        'Staff scheduling',
        'Up to 20 staff members',
        'Priority support',
        '20GB storage',
        'API access',
        'Custom reporting',
      ],
      price: '$49/month',
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      icon: <Building2 className="w-3.5 h-3.5" />,
      color: isDark ? 'text-purple-400' : 'text-purple-700',
      bgColor: isDark ? 'bg-purple-500/15' : 'bg-purple-50',
      ringColor: isDark ? 'ring-purple-500/60' : 'ring-purple-600/70',
      textColor: isDark ? 'text-purple-400' : 'text-purple-700',
      hoverBg: isDark ? 'hover:bg-purple-500/10' : 'hover:bg-purple-100/70',
      features: [
        'Unlimited staff members',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Unlimited storage',
        'Advanced security',
        'Enterprise API access',
        'Custom development',
      ],
      price: 'Custom',
    },
  };

  const currentConfig = planConfigs[currentPlan];
  const otherPlans = Object.values(planConfigs).filter(
    (plan) => plan.id !== currentPlan
  );

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

  const handleUpgrade = (planId: string) => {
    onUpgradeClick?.(planId);
    setIsDropdownOpen(false);
  };

  const handleManageBilling = () => {
    onManageClick?.();
    setIsDropdownOpen(false);
  };

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
          currentConfig.ringColor,
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
            currentConfig.ringColor,
            currentConfig.bgColor,
            isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
          )}
        >
          <div className={currentConfig.textColor}>{currentConfig.icon}</div>
        </div>

        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn('text-xs font-semibold truncate', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {currentConfig.name} Plan
          </span>
          <span className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {currentConfig.price}
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
                  currentConfig.ringColor,
                  currentConfig.bgColor
                )}
              >
                <Crown className={cn('w-5 h-5', currentConfig.textColor)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={cn('text-sm font-bold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                    {currentConfig.name}
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-bold rounded-full',
                      currentConfig.bgColor,
                      currentConfig.color
                    )}
                  >
                    Active
                  </span>
                </div>
                <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {currentConfig.price}
                </p>
              </div>
            </div>

            {/* Current Plan Features */}
            <div className="mt-3 space-y-2">
              <h4 className={cn('text-xs font-semibold', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Included in your plan:
              </h4>
              <div className="space-y-1.5">
                {currentConfig.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', currentConfig.color)} />
                    <span className={cn('text-xs', isDark ? 'text-gray-300' : 'text-gray-600')}>
                      {feature}
                    </span>
                  </div>
                ))}
                {currentConfig.features.length > 4 && (
                  <p className={cn('text-xs pl-5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    +{currentConfig.features.length - 4} more features
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
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
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
              <span>Plan settings</span>
            </button>

            <a
              href="#"
              className={cn(
                'flex items-center justify-center gap-1 px-3 py-2 text-xs',
                'transition-colors',
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Compare all features
              <ExternalLink className="w-3 h-3" />
            </a>
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
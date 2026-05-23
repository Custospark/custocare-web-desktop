import React, { useState, useRef, useEffect } from 'react';
import { Crown, Sparkles, Building2, CheckCircle2, ChevronDown, CreditCard, Settings, ExternalLink, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../../types/cn';
import { useNavigate } from 'react-router-dom';
import { useGetFacilitySubscription, useGetPlans } from '../../../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import { SubscriptionStatus, type Plan } from '../../../../modules/administration/admin-module/api/subscriptions/SubscriptionTypes';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../app/routes/constants/administration.paths';

interface SubscriptionProps {
  isDark: boolean;
  isMobile: boolean;
  className?: string;
}

const COLORS: Record<string, (d: boolean) => { color: string; bgColor: string; ringColor: string; hoverBg: string }> = {
  essential: (d) => ({
    color: d ? 'text-emerald-400' : 'text-emerald-700',
    bgColor: d ? 'bg-emerald-500/15' : 'bg-emerald-50',
    ringColor: d ? 'ring-emerald-500/60' : 'ring-emerald-600/70',
    hoverBg: d ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-100/70',
  }),
  professional: (d) => ({
    color: d ? 'text-blue-400' : 'text-blue-700',
    bgColor: d ? 'bg-blue-500/15' : 'bg-blue-50',
    ringColor: d ? 'ring-blue-500/60' : 'ring-blue-600/70',
    hoverBg: d ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100/70',
  }),
};

const getC = (slug: string, d: boolean) => COLORS[slug]?.(d) ?? {
  color: d ? 'text-purple-400' : 'text-purple-700',
  bgColor: d ? 'bg-purple-500/15' : 'bg-purple-50',
  ringColor: d ? 'ring-purple-500/60' : 'ring-purple-600/70',
  hoverBg: d ? 'hover:bg-purple-500/10' : 'hover:bg-purple-100/70',
};

const getIcon = (slug: string) =>
  slug === 'essential' ? <Crown className="w-3.5 h-3.5" /> :
  slug === 'professional' ? <Sparkles className="w-3.5 h-3.5" /> :
  <Building2 className="w-3.5 h-3.5" />;

const lims = (l: Plan['limits']) => [
  l.max_staff !== null ? `Up to ${l.max_staff} staff` : 'Unlimited staff',
  l.max_departments !== null ? `Up to ${l.max_departments} departments` : 'Unlimited departments',
  l.max_patients_per_month !== null ? `Up to ${l.max_patients_per_month} patients per month` : 'Unlimited patients per month',
];

export const Subscription: React.FC<SubscriptionProps> = ({ isDark, isMobile, className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: subRes, isLoading: subLoading, error } = useGetFacilitySubscription();
  const { data: plansRes, isLoading: plansLoading } = useGetPlans();

  const sub = subRes?.data;
  const current = sub?.plan;
  const plans = (plansRes?.data || []) as Plan[];
  const isTrial = sub?.status === SubscriptionStatus.TRIAL;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loading = subLoading || plansLoading;

  const sorted = [...plans].sort((a, b) => a.pricing.usd - b.pricing.usd);
  const currentPrice = current?.pricing.usd ?? 0;

  const otherPlans = sorted
    .filter((p) => p.id !== current?.id)
    .map((p) => ({
      plan: p,
      slug: p.slug,
      isHigher: p.pricing.usd > currentPrice,
      isLower: p.pricing.usd < currentPrice,
    }))
    .slice(0, 3);

  if (loading) {
    return (
      <div className={cn('relative', className)}>
        <button disabled className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-gray-300 dark:ring-gray-700', isDark ? 'bg-gray-800/40' : 'bg-gray-100', 'opacity-70 cursor-wait')}>
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center ring-1', isDark ? 'bg-gray-700 ring-gray-600' : 'bg-gray-200 ring-gray-300')}>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
          </div>
          <span className={cn('hidden lg:block text-xs font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>Loading...</span>
        </button>
      </div>
    );
  }

  if (error || !sub || !current) {
    return (
      <div className={cn('relative', className)}>
        <button onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
          className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-amber-500/50 cursor-pointer', isDark ? 'bg-amber-900/20 hover:bg-amber-900/30' : 'bg-amber-50 hover:bg-amber-100')}>
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center ring-1 ring-amber-500/50', isDark ? 'bg-amber-900/30' : 'bg-amber-100')}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="hidden lg:block">
            <span className={cn('text-xs font-semibold', isDark ? 'text-amber-400' : 'text-amber-700')}>Choose a Plan</span>
            <span className={cn('block text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>Get started today</span>
          </div>
          <ChevronDown className="hidden lg:block w-3 h-3 ml-auto text-amber-500" />
        </button>
      </div>
    );
  }

  const cc = getC(current.slug || 'essential', isDark);
  const currentFeatures = lims(current.limits);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button onClick={() => setOpen(!open)}
        className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 cursor-pointer', cc.ringColor, isDark ? 'bg-gray-800/40 hover:bg-gray-800/70' : 'bg-white hover:bg-gray-50')}>
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center ring-1 ring-offset-1', cc.ringColor, cc.bgColor, isDark ? 'ring-offset-gray-900' : 'ring-offset-white')}>
          <span className={cc.color}>{getIcon(current.slug || 'essential')}</span>
        </div>
        <div className="hidden lg:block">
          <span className={cn('text-xs font-semibold truncate', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {current.name}{isTrial && <span className="ml-1 text-amber-500">(Trial)</span>}
          </span>
          <span className={cn('block text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
            ${current.pricing.usd}/mo
          </span>
        </div>
        <ChevronDown className={cn('hidden lg:block w-3 h-3 transition-transform', isDark ? 'text-gray-400' : 'text-gray-500', open && 'rotate-180')} />
      </button>

      {open && (
        <div className={cn('rounded-xl border shadow-2xl z-50', isMobile ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md' : 'absolute right-0 mt-2 w-80', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          {/* Current Plan */}
          <div className={cn('px-4 py-3 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center ring-2', cc.ringColor, cc.bgColor)}>{getIcon(current.slug || 'essential')}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={cn('text-sm font-bold', isDark ? 'text-gray-100' : 'text-gray-900')}>{current.name}</span>
                  <span className={cn('px-2 py-0.5 text-xs font-bold rounded-full', cc.bgColor, cc.color)}>{isTrial ? 'Trial' : 'Active'}</span>
                </div>
                <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>${current.pricing.usd}/mo</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {currentFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', cc.color)} />
                  <span className={cn('text-xs', isDark ? 'text-gray-300' : 'text-gray-600')}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Other Plans */}
          {otherPlans.length > 0 && (
            <div className={cn('px-3 py-2 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <p className={cn('text-xs font-medium mb-2 px-1', isDark ? 'text-gray-400' : 'text-gray-600')}>Other plans</p>
              <div className="space-y-1">
                {otherPlans.map(({ plan: p, slug, isHigher, isLower }) => {
                  const pc = getC(slug, isDark);
                  return (
                    <button key={p.id} onClick={() => { navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS); setOpen(false); }}
                      className={cn('w-full flex items-center gap-3 p-2 rounded-md cursor-pointer', pc.hoverBg, isDark ? 'text-gray-200' : 'text-gray-900')}>
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center ring-1', pc.ringColor, pc.bgColor)}>
                        <span className={cn('w-4 h-4', pc.color)}>{getIcon(slug)}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{p.name}</span>
                          <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>${p.pricing.usd}/mo</span>
                        </div>
                        <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-600')}>{lims(p.limits)[0]}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {isHigher && <ArrowUp className="w-3 h-3 text-blue-500" />}
                        {isLower && <ArrowDown className="w-3 h-3 text-amber-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={cn('p-2 space-y-1', isDark ? 'bg-gray-800/20' : 'bg-gray-50/50')}>
            <button onClick={() => { navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS); setOpen(false); }}
              className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer', isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}>
              <CreditCard className="w-4 h-4" /><span>Make Payment</span>
            </button>
            <button onClick={() => { navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS); setOpen(false); }}
              className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer', isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}>
              <Settings className="w-4 h-4" /><span>View all plans</span>
            </button>
            <button onClick={() => { navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS); setOpen(false); }}
              className={cn('flex items-center justify-center gap-1 px-3 py-2 text-xs w-full cursor-pointer', isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900')}>
              Compare all features <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Subscription);

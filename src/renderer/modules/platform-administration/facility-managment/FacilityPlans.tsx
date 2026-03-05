/**
 * ============================================================================
 * FACILITY PLANS MANAGER
 * ============================================================================
 * Platform administrator interface for creating, editing, and managing
 * subscription plans that facility/hospital/clinic admins can subscribe to.
 *
 * Endpoints used (admin only):
 *   GET    /admin/billing/plans          → useGetAdminPlans
 *   POST   /admin/billing/plans          → useAdminCreatePlan
 *   PUT    /admin/billing/plans/{plan}   → useAdminUpdatePlan
 *   DELETE /admin/billing/plans/{plan}   → useAdminDeletePlan
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  RefreshCw,
  Star,
  AlertCircle,
  DollarSign,
  Users,
  Building2,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Filter,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';
import {
  useGetAdminPlans,
  useAdminCreatePlan,
  useAdminUpdatePlan,
  useAdminDeletePlan,
} from '../../administration/admin-module/api/subscriptions/SubscriptionQueries';
import {
  BillingCycle,
  type Plan,
  type StorePlanRequest,
  type AdminPlanFilters,
} from '../../administration/admin-module/api/subscriptions/SubscriptionTypes';
import type { RootState } from '../../../app/store/store';
import { useSelector } from 'react-redux';

/* -------------------------------------------------------------------------- */
/*                              TYPES & CONSTANTS                             */
/* -------------------------------------------------------------------------- */

interface FacilityPlansProps {
  theme?: 'light' | 'dark';
}

interface PlanFormState {
  name: string;
  slug: string;
  description: string;
  price_usd: string;
  price_ugx: string;
  onboarding_fee_usd: string;
  onboarding_fee_ugx: string;
  billing_cycle: BillingCycle;
  trial_days: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: string;
  max_staff: string;
  max_departments: string;
  max_patients_per_month: string;
  features: Record<string, boolean>;
}

type DrawerMode = 'create' | 'edit';
type ActiveFilter = 'all' | 'active' | 'inactive';

const DEFAULT_FEATURES: { key: string; label: string; description: string }[] = [
  { key: 'lab_integration',       label: 'Lab Integration',         description: 'Connect lab systems & results' },
  { key: 'pharmacy_module',       label: 'Pharmacy Module',         description: 'Manage dispensing & inventory' },
  { key: 'telemedicine',          label: 'Telemedicine',            description: 'Remote consultation support' },
  { key: 'appointment_scheduling',label: 'Appointment Scheduling',  description: 'Online & in-person scheduling' },
  { key: 'billing_module',        label: 'Billing Module',          description: 'Invoicing & payment tracking' },
  { key: 'inventory_management',  label: 'Inventory Management',    description: 'Stock & supplies tracking' },
  { key: 'patient_portal',        label: 'Patient Portal',          description: 'Self-service patient access' },
  { key: 'custom_reports',        label: 'Custom Reports',          description: 'Advanced analytics & exports' },
  { key: 'api_access',            label: 'API Access',              description: 'External system integrations' },
  { key: 'staff_scheduling',      label: 'Staff Scheduling',        description: 'Shift & roster management' },
  { key: 'audit_logs',            label: 'Audit Logs',              description: 'Full activity trail' },
  { key: 'multi_department',      label: 'Multi-Department',        description: 'Manage multiple departments' },
];

const emptyForm = (): PlanFormState => ({
  name: '',
  slug: '',
  description: '',
  price_usd: '',
  price_ugx: '',
  onboarding_fee_usd: '0',
  onboarding_fee_ugx: '0',
  billing_cycle: BillingCycle.MONTHLY,
  trial_days: '7',
  is_popular: false,
  is_active: true,
  sort_order: '0',
  max_staff: '',
  max_departments: '',
  max_patients_per_month: '',
  features: Object.fromEntries(DEFAULT_FEATURES.map(f => [f.key, false])),
});

const generateSlug = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// const formatCurrency = (amount: number, currency: 'USD' | 'UGX'): string => {
//   if (currency === 'USD') return `$${amount.toLocaleString()}`;
//   return `UGX ${amount.toLocaleString()}`;
// };

// const formatDate = (iso: string | null): string => {
//   if (!iso) return '—';
//   return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
// };

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const FacilityPlans: React.FC<FacilityPlansProps> = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();

  /* ── UI State ─────────────────────────────────────────────────────────── */
  const [searchTerm,     setSearchTerm]     = useState('');
  const [activeFilter,   setActiveFilter]   = useState<ActiveFilter>('all');
  const [isFocused,      setIsFocused]      = useState(false);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [drawerMode,     setDrawerMode]     = useState<DrawerMode>('create');
  const [selectedPlan,   setSelectedPlan]   = useState<Plan | null>(null);
  const [formState,      setFormState]      = useState<PlanFormState>(emptyForm);
  const [formErrors,     setFormErrors]     = useState<Partial<Record<keyof PlanFormState, string>>>({});
  const [slugEdited,     setSlugEdited]     = useState(false);
  const [showFeatures,   setShowFeatures]   = useState(false);
  const [customFeatKey,  setCustomFeatKey]  = useState('');

  /* ── Query Filters ────────────────────────────────────────────────────── */
  const queryFilters = useMemo((): AdminPlanFilters => {
    const f: AdminPlanFilters = { per_page: 12 };
    if (activeFilter === 'active')   f.is_active = true;
    if (activeFilter === 'inactive') f.is_active = false;
    if (searchTerm.trim()) f.search = searchTerm.trim();
    return f;
  }, [activeFilter, searchTerm]);

  /* ── Data Fetching ────────────────────────────────────────────────────── */
  const {
    data: plansData,
    isLoading,
    refetch,
    isRefetching,
  } = useGetAdminPlans({ ...queryFilters, /* current_page */ }, {
    keepPreviousData: true,
  } as any);

  const plans        = plansData?.data    ?? [];
  const meta         = plansData?.meta;
  const totalPlans   = meta?.total        ?? 0;
  const lastPage     = meta?.last_page    ?? 1;

  const activePlansCount   = plans.filter(p => p.is_active).length;
  const inactivePlansCount = plans.filter(p => !p.is_active).length;
  const popularPlansCount  = plans.filter(p => p.is_popular).length;

  /* ── Mutations ────────────────────────────────────────────────────────── */
  const createMutation = useAdminCreatePlan({
    onSuccess: () => { closeDrawer(); refetch(); },
  });

  const updateMutation = useAdminUpdatePlan({
    onSuccess: () => { closeDrawer(); refetch(); },
  });

  const deleteMutation = useAdminDeletePlan({
    onSuccess: () => refetch(),
  });

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  /* ── Drawer Helpers ───────────────────────────────────────────────────── */
  const openCreateDrawer = useCallback(() => {
    setDrawerMode('create');
    setSelectedPlan(null);
    setFormState(emptyForm());
    setFormErrors({});
    setSlugEdited(false);
    setShowFeatures(false);
    setCustomFeatKey('');
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((plan: Plan) => {
    const existingFeatures: Record<string, boolean> = {};
    DEFAULT_FEATURES.forEach(f => {
      existingFeatures[f.key] = Boolean(plan.features?.[f.key]);
    });
    // Preserve any extra custom features from the plan
    Object.entries(plan.features ?? {}).forEach(([k, v]) => {
      if (!(k in existingFeatures)) existingFeatures[k] = Boolean(v);
    });

    setDrawerMode('edit');
    setSelectedPlan(plan);
    setFormState({
      name:                   plan.name,
      slug:                   plan.slug,
      description:            plan.description ?? '',
      price_usd:              String(plan.pricing.usd),
      price_ugx:              String(plan.pricing.ugx),
      onboarding_fee_usd:     String(plan.onboarding_fee.usd),
      onboarding_fee_ugx:     String(plan.onboarding_fee.ugx),
      billing_cycle:          (plan.pricing.billing_cycle as BillingCycle) ?? BillingCycle.MONTHLY,
      trial_days:             String(plan.trial_days),
      is_popular:             plan.is_popular,
      is_active:              plan.is_active,
      sort_order:             String(plan.sort_order),
      max_staff:              plan.limits.max_staff !== null ? String(plan.limits.max_staff) : '',
      max_departments:        plan.limits.max_departments !== null ? String(plan.limits.max_departments) : '',
      max_patients_per_month: plan.limits.max_patients_per_month !== null ? String(plan.limits.max_patients_per_month) : '',
      features:               existingFeatures,
    });
    setFormErrors({});
    setSlugEdited(true); // don't auto-update slug when editing
    setShowFeatures(false);
    setCustomFeatKey('');
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedPlan(null);
    setFormState(emptyForm());
    setFormErrors({});
    setCustomFeatKey('');
  }, []);

  /* ── Form Helpers ─────────────────────────────────────────────────────── */
  const updateField = useCallback(<K extends keyof PlanFormState>(
    key: K,
    value: PlanFormState[K],
  ) => {
    setFormState(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugEdited) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
    setFormErrors(prev => ({ ...prev, [key]: undefined }));
  }, [slugEdited]);

  const toggleFeature = useCallback((key: string) => {
    setFormState(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  }, []);

  const addCustomFeature = useCallback(() => {
    const key = customFeatKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key) return;
    setFormState(prev => ({ ...prev, features: { ...prev.features, [key]: true } }));
    setCustomFeatKey('');
  }, [customFeatKey]);

  const removeFeature = useCallback((key: string) => {
    setFormState(prev => {
      const { [key]: _, ...rest } = prev.features;
      return { ...prev, features: rest };
    });
  }, []);

  /* ── Validation ───────────────────────────────────────────────────────── */
  const validateForm = useCallback((): boolean => {
    const errs: Partial<Record<keyof PlanFormState, string>> = {};
    if (!formState.name.trim())    errs.name    = 'Plan name is required.';
    if (!formState.slug.trim())    errs.slug    = 'Slug is required.';
    if (!formState.price_usd || isNaN(Number(formState.price_usd)) || Number(formState.price_usd) < 0)
      errs.price_usd = 'Valid USD price required.';
    if (!formState.price_ugx || isNaN(Number(formState.price_ugx)) || Number(formState.price_ugx) < 0)
      errs.price_ugx = 'Valid UGX price required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formState]);

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const payload: StorePlanRequest = {
      name:            formState.name.trim(),
      slug:            formState.slug.trim(),
      description:     formState.description.trim() || null,
      price_usd:       Number(formState.price_usd),
      price_ugx:       Number(formState.price_ugx),
      onboarding_fee_usd:     formState.onboarding_fee_usd ? Number(formState.onboarding_fee_usd) : null,
      onboarding_fee_ugx:     formState.onboarding_fee_ugx ? Number(formState.onboarding_fee_ugx) : null,
      billing_cycle:   formState.billing_cycle,
      trial_days:      formState.trial_days !== '' ? Number(formState.trial_days) : null,
      is_popular:      formState.is_popular,
      is_active:       formState.is_active,
      sort_order:      formState.sort_order !== '' ? Number(formState.sort_order) : null,
      max_staff:              formState.max_staff !== '' ? Number(formState.max_staff) : null,
      max_departments:        formState.max_departments !== '' ? Number(formState.max_departments) : null,
      max_patients_per_month: formState.max_patients_per_month !== '' ? Number(formState.max_patients_per_month) : null,
      features:        formState.features,
    };

    if (drawerMode === 'create') {
      createMutation.mutate({ data: payload });
    } else if (selectedPlan) {
      updateMutation.mutate({ planId: selectedPlan.id, data: payload });
    }
  }, [validateForm, formState, drawerMode, selectedPlan, createMutation, updateMutation]);

  /* ── Delete ───────────────────────────────────────────────────────────── */
  const handleDelete = useCallback(async (plan: Plan) => {
    const ok = await confirm({
      title: 'Delete Plan',
      message: `Are you sure you want to delete "${plan.name}"? This will fail if any active subscriptions reference this plan.`,
      confirmText: 'Delete Plan',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });
    if (!ok) return;
    deleteMutation.mutate({ planId: plan.id });
  }, [confirm, theme, deleteMutation]);

  /* ── Render Helpers ───────────────────────────────────────────────────── */
  // const getStatusColor = (isActive: boolean) =>
  //   isActive
  //     ? isDark ? 'text-green-400 bg-green-900/30 border-green-500/30' : 'text-green-700 bg-green-100 border-green-200'
  //     : isDark ? 'text-gray-400 bg-gray-800 border-gray-700'          : 'text-gray-600 bg-gray-200 border-gray-300';

  const allFeatKeys = useMemo(
    () => Array.from(new Set([...DEFAULT_FEATURES.map(f => f.key), ...Object.keys(formState.features)])),
    [formState.features]
  );

  /* ── Stats ────────────────────────────────────────────────────────────── */
  const statsCards = [
    { label: 'Total Plans',    value: totalPlans,        color: 'blue',   icon: <Package className="w-5 h-5" /> },
    { label: 'Active',         value: activePlansCount,  color: 'green',  icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Inactive',       value: inactivePlansCount,color: 'gray',   icon: <XCircle className="w-5 h-5" /> },
    { label: 'Featured',       value: popularPlansCount, color: 'amber',  icon: <Star className="w-5 h-5" /> },
  ] as const;

  const colorMap = {
    blue:  { card: isDark ? 'border-blue-500/30 hover:border-blue-500/50 hover:shadow-blue-500/20'  : 'border-blue-200 hover:border-blue-400 hover:shadow-blue-500/20',  icon: isDark ? 'bg-blue-500/20 text-blue-400'   : 'bg-blue-100 text-blue-600' },
    green: { card: isDark ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/20': 'border-green-200 hover:border-green-400 hover:shadow-green-500/20', icon: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600' },
    gray:  { card: isDark ? 'border-gray-600/30 hover:border-gray-500/50 hover:shadow-gray-500/20'  : 'border-gray-300 hover:border-gray-400 hover:shadow-gray-500/20',   icon: isDark ? 'bg-gray-700 text-gray-400'      : 'bg-gray-200 text-gray-600' },
    amber: { card: isDark ? 'border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/20': 'border-amber-200 hover:border-amber-400 hover:shadow-amber-500/20', icon: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600' },
  };

  /* ──────────────────────────────────────────────────────────────────────── */
  /*                               RENDER                                    */
  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300 group',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20'
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity">
          <div className={isDark ? 'bg-blue-500/10 w-full h-full rounded-full' : 'bg-blue-500/5 w-full h-full rounded-full'} />
        </div>

        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300 group-hover:scale-110',
                isDark ? 'bg-blue-500/20 group-hover:bg-blue-500/30' : 'bg-blue-100 group-hover:bg-blue-200',
              )}>
                <Package className={cn('w-6 h-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Subscription Plans
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200',
                  )}>
                    {totalPlans} plans
                  </span>
                </h2>
                <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Create and manage subscription plans for facilities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2 transition-all cursor-pointer',
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                  (isLoading || isRefetching) && 'opacity-50 cursor-not-allowed',
                )}
              >
                <RefreshCw className={cn('w-4 h-4', (isLoading || isRefetching) && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={openCreateDrawer}
                disabled={isMutating}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium border-2 transition-all cursor-pointer',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                  'transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                <Plus className="w-4 h-4" />
                New Plan
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statsCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg group/stat',
                  isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-white to-gray-50',
                  colorMap[s.color].card,
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('p-2 rounded-lg transition-all duration-300 group-hover/stat:scale-110', colorMap[s.color].icon)}>
                    {s.icon}
                  </div>
                </div>
                <p className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>{s.value}</p>
                <p className={cn('text-xs mt-1', isDark ? 'text-gray-400' : 'text-gray-600')}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
          isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300',
        )}
      >
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          {/* Animated Search */}
          <div className="relative flex-1">
            <motion.div
              className="absolute inset-0 rounded-lg z-0"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)', backgroundSize: '300% 100%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: isFocused ? 2 : 6, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors',
                isFocused ? 'text-blue-500' : isDark ? 'text-gray-500' : 'text-gray-400',
              )} />
              <input
                type="text"
                placeholder="Search plans by name, slug…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  'w-full pl-10 pr-10 py-2.5 text-sm border-transparent focus:outline-none focus:ring-0',
                  isDark ? 'bg-gray-900 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400',
                )}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full cursor-pointer', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {(['all', 'active', 'inactive'] as ActiveFilter[]).map(f => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all cursor-pointer capitalize',
                activeFilter === f
                  ? isDark ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
              )}
            >
              <Filter className="w-3 h-3" />
              {f}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Plans Grid ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {isLoading ? (
          <LoadingSkeleton variant="card" theme={theme} message="Loading subscription plans…" />
        ) : plans.length === 0 ? (
          <div className={cn(
            'relative overflow-hidden rounded-xl border-2 p-12 text-center',
            isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200',
          )}>
            <div className={cn('w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center', isDark ? 'bg-gray-800' : 'bg-gray-100')}>
              <Package className={cn('w-10 h-10', isDark ? 'text-gray-600' : 'text-gray-400')} />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {searchTerm ? 'No plans match your search' : 'No plans created yet'}
            </h3>
            <p className={cn('mb-6 text-sm max-w-sm mx-auto', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {searchTerm ? `Try clearing the search or changing filters.` : 'Create your first subscription plan to get started.'}
            </p>
            {!searchTerm && (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={openCreateDrawer}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium border-2 transition-all cursor-pointer',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                  'transform hover:-translate-y-0.5',
                )}
              >
                <Plus className="w-4 h-4" />
                Create First Plan
              </motion.button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={idx}
                isDark={isDark}
                isMutating={isMutating}
                onEdit={() => openEditDrawer(plan)}
                onDelete={() => handleDelete(plan)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {lastPage > 1 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Page {meta?.current_page ?? 1} of {lastPage} — {totalPlans} plans total
          </p>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={cn(
                'p-2 rounded-lg border-2 transition-all cursor-pointer',
                isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
                currentPage <= 1 && 'opacity-50 cursor-not-allowed',
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border-2', isDark ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600 border-blue-400 text-white')}>
              {currentPage}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
              disabled={currentPage >= lastPage}
              className={cn(
                'p-2 rounded-lg border-2 transition-all cursor-pointer',
                isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
                currentPage >= lastPage && 'opacity-50 cursor-not-allowed',
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Create / Edit Drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isMutating && closeDrawer()} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'absolute right-0 top-0 h-full w-full max-w-lg border-l-2 flex flex-col',
                isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30' : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200',
              )}
            >
              {/* Drawer Header */}
              <div className={cn('relative p-6 border-b-2 shrink-0', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none">
                  <div className={cn('w-full h-full rounded-full', isDark ? 'bg-blue-500/10' : 'bg-blue-500/5')} />
                </div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-xl', isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
                      {drawerMode === 'create' ? <Plus className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} /> : <Edit className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{drawerMode === 'create' ? 'Create New Plan' : `Edit: ${selectedPlan?.name}`}</h3>
                      <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {drawerMode === 'create' ? 'Configure a new subscription plan' : 'Update plan details'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={closeDrawer}
                    disabled={isMutating}
                    className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600', isMutating && 'opacity-50 cursor-not-allowed')}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* ── Section: Identity ── */}
                <FormSection title="Plan Identity" icon={<Package className="w-4 h-4" />} isDark={isDark}>
                  <div className="space-y-4">
                    <FormField label="Plan Name" required error={formErrors.name} isDark={isDark}>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={e => updateField('name', e.target.value)}
                        placeholder="e.g., Professional Plan"
                        disabled={isMutating}
                        className={inputClass(isDark, !!formErrors.name, isMutating)}
                      />
                    </FormField>

                    <FormField label="Slug" required error={formErrors.slug} isDark={isDark}
                      hint={<span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Preview: <code className="text-blue-500">{formState.slug || '—'}</code></span>}
                    >
                      <input
                        type="text"
                        value={formState.slug}
                        onChange={e => { setSlugEdited(true); updateField('slug', e.target.value); }}
                        placeholder="e.g., professional-plan"
                        disabled={isMutating}
                        className={inputClass(isDark, !!formErrors.slug, isMutating)}
                      />
                    </FormField>

                    <FormField label="Description" isDark={isDark}>
                      <textarea
                        rows={3}
                        value={formState.description}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Brief description of this plan…"
                        disabled={isMutating}
                        className={cn(inputClass(isDark, false, isMutating), 'resize-none')}
                      />
                    </FormField>

                    {/* Toggles Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <ToggleField
                        label="Active"
                        hint="Facilities can subscribe"
                        value={formState.is_active}
                        onChange={v => updateField('is_active', v)}
                        isDark={isDark}
                        activeColor="green"
                      />
                      <ToggleField
                        label="Popular / Featured"
                        hint="Highlighted on pricing page"
                        value={formState.is_popular}
                        onChange={v => updateField('is_popular', v)}
                        isDark={isDark}
                        activeColor="amber"
                      />
                    </div>

                    <FormField label="Sort Order" hint="Lower = higher position" isDark={isDark}>
                      <input
                        type="number" min="0"
                        value={formState.sort_order}
                        onChange={e => updateField('sort_order', e.target.value)}
                        disabled={isMutating}
                        className={inputClass(isDark, false, isMutating)}
                      />
                    </FormField>
                  </div>
                </FormSection>

                {/* ── Section: Pricing ── */}
                <FormSection title="Pricing & Billing" icon={<DollarSign className="w-4 h-4" />} isDark={isDark}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Price (USD)" required error={formErrors.price_usd} isDark={isDark}>
                        <div className="relative">
                          <span className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>$</span>
                          <input type="number" min="0" value={formState.price_usd} onChange={e => updateField('price_usd', e.target.value)} disabled={isMutating} className={cn(inputClass(isDark, !!formErrors.price_usd, isMutating), 'pl-7')} />
                        </div>
                      </FormField>
                      <FormField label="Price (UGX)" required error={formErrors.price_ugx} isDark={isDark}>
                        <input type="number" min="0" value={formState.price_ugx} onChange={e => updateField('price_ugx', e.target.value)} disabled={isMutating} className={inputClass(isDark, !!formErrors.price_ugx, isMutating)} />
                      </FormField>
                    </div>

                    <FormField label="Billing Cycle" isDark={isDark}>
                      <div className="relative">
                        <select value={formState.billing_cycle} onChange={e => updateField('billing_cycle', e.target.value as BillingCycle)} disabled={isMutating} className={cn(inputClass(isDark, false, isMutating), 'appearance-none cursor-pointer')}>
                          <option value={BillingCycle.MONTHLY}>Monthly</option>
                        </select>
                        <ChevronDown className={cn('absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none', isDark ? 'text-gray-400' : 'text-gray-500')} />
                      </div>
                    </FormField>

                    <FormField label="Trial Period (days)" hint="0 = no trial" isDark={isDark}>
                      <div className="relative">
                        <Clock className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input type="number" min="0" max="90" value={formState.trial_days} onChange={e => updateField('trial_days', e.target.value)} disabled={isMutating} className={cn(inputClass(isDark, false, isMutating), 'pl-10')} />
                      </div>
                    </FormField>

                    <div className={cn('rounded-xl p-4 border-2', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200')}>
                      <p className={cn('text-sm font-medium mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>Onboarding Fee <span className={cn('text-xs font-normal', isDark ? 'text-gray-500' : 'text-gray-400')}>(one-time setup)</span></p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="USD" isDark={isDark}>
                          <div className="relative">
                            <span className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>$</span>
                            <input type="number" min="0" value={formState.onboarding_fee_usd} onChange={e => updateField('onboarding_fee_usd', e.target.value)} disabled={isMutating} className={cn(inputClass(isDark, false, isMutating), 'pl-7')} />
                          </div>
                        </FormField>
                        <FormField label="UGX" isDark={isDark}>
                          <input type="number" min="0" value={formState.onboarding_fee_ugx} onChange={e => updateField('onboarding_fee_ugx', e.target.value)} disabled={isMutating} className={inputClass(isDark, false, isMutating)} />
                        </FormField>
                      </div>
                    </div>
                  </div>
                </FormSection>

                {/* ── Section: Capacity Limits ── */}
                <FormSection title="Capacity Limits" icon={<Users className="w-4 h-4" />} isDark={isDark}
                  hint="Leave blank for unlimited"
                >
                  <div className="space-y-4">
                    <FormField label="Max Staff Members" hint="Blank = unlimited" isDark={isDark}>
                      <div className="relative">
                        <Users className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input type="number" min="1" placeholder="Unlimited" value={formState.max_staff} onChange={e => updateField('max_staff', e.target.value)} disabled={isMutating} className={cn(inputClass(isDark, false, isMutating), 'pl-10')} />
                      </div>
                    </FormField>
                    <FormField label="Max Departments" hint="Blank = unlimited" isDark={isDark}>
                      <div className="relative">
                        <Building2 className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input type="number" min="1" placeholder="Unlimited" value={formState.max_departments} onChange={e => updateField('max_departments', e.target.value)} disabled={isMutating} className={cn(inputClass(isDark, false, isMutating), 'pl-10')} />
                      </div>
                    </FormField>
                    <FormField label="Max Patients / Month" hint="Blank = unlimited" isDark={isDark}>
                      <div className="relative">
                        <Activity className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <input type="number" min="1" placeholder="Unlimited" value={formState.max_patients_per_month} onChange={e => updateField('max_patients_per_month', e.target.value)} disabled={isMutating} className={cn(inputClass(isDark, false, isMutating), 'pl-10')} />
                      </div>
                    </FormField>
                  </div>
                </FormSection>

                {/* ── Section: Features ── */}
                <FormSection
                  title={`Features (${Object.values(formState.features).filter(Boolean).length} enabled)`}
                  icon={<Zap className="w-4 h-4" />}
                  isDark={isDark}
                  collapsible
                  expanded={showFeatures}
                  onToggle={() => setShowFeatures(v => !v)}
                >
                  <AnimatePresence>
                    {showFeatures && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          {allFeatKeys.map(key => {
                            const def = DEFAULT_FEATURES.find(f => f.key === key);
                            const isDefault = !!def;
                            const isEnabled = !!formState.features[key];
                            return (
                              <motion.div
                                key={key}
                                whileHover={{ x: 2 }}
                                className={cn(
                                  'flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer',
                                  isEnabled
                                    ? isDark ? 'bg-blue-900/20 border-blue-500/40' : 'bg-blue-50 border-blue-300'
                                    : isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300',
                                )}
                                onClick={() => toggleFeature(key)}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={cn('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{def?.label ?? key}</span>
                                    {!isDefault && (
                                      <span className={cn('text-xs px-1.5 py-0.5 rounded border', isDark ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200')}>custom</span>
                                    )}
                                  </div>
                                  {def?.description && <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-500' : 'text-gray-500')}>{def.description}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isDefault && (
                                    <button
                                      onClick={e => { e.stopPropagation(); removeFeature(key); }}
                                      className={cn('p-1 rounded-full cursor-pointer', isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500')}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                  {isEnabled
                                    ? <ToggleRight className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                                    : <ToggleLeft className={cn('w-5 h-5', isDark ? 'text-gray-600' : 'text-gray-400')} />}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Custom feature adder */}
                        <div className={cn('rounded-xl p-3 border-2 border-dashed', isDark ? 'border-gray-700' : 'border-gray-300')}>
                          <p className={cn('text-xs font-medium mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>Add Custom Feature</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customFeatKey}
                              onChange={e => setCustomFeatKey(e.target.value)}
                              placeholder="feature_key"
                              onKeyDown={e => e.key === 'Enter' && addCustomFeature()}
                              className={cn(inputClass(isDark, false, false), 'text-xs flex-1')}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={addCustomFeature}
                              disabled={!customFeatKey.trim()}
                              className={cn('px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all cursor-pointer', isDark ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600 border-blue-400 text-white', 'disabled:opacity-50 disabled:cursor-not-allowed')}
                            >
                              <Plus className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FormSection>
              </div>

              {/* Drawer Footer */}
              <div className={cn('p-6 border-t-2 shrink-0', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={closeDrawer}
                    disabled={isMutating}
                    className={cn('flex-1 py-2.5 rounded-xl font-medium border-2 transition-all cursor-pointer', isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200', isMutating && 'opacity-50 cursor-not-allowed')}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isMutating}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl font-medium border-2 transition-all flex items-center justify-center gap-2',
                      isMutating
                        ? 'opacity-60 cursor-not-allowed'
                        : 'cursor-pointer',
                      isDark
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-lg hover:shadow-blue-500/20'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-lg hover:shadow-blue-500/20',
                      'transform hover:-translate-y-0.5',
                    )}
                  >
                    {isMutating ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{drawerMode === 'create' ? 'Creating…' : 'Updating…'}</>
                    ) : (
                      <>{drawerMode === 'create' ? <><Plus className="w-4 h-4" /> Create Plan</> : <><CheckCircle className="w-4 h-4" /> Save Changes</>}</>
                    )}
                  </motion.button>
                </div>
                <p className={cn('text-xs text-center mt-3', isDark ? 'text-gray-500' : 'text-gray-400')}>
                  {drawerMode === 'create' ? 'Plan will be available for facility subscriptions immediately.' : 'Changes apply to new subscriptions; existing ones unaffected.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            PLAN CARD SUBCOMPONENT                         */
/* -------------------------------------------------------------------------- */

interface PlanCardProps {
  plan: Plan;
  index: number;
  isDark: boolean;
  isMutating: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, index, isDark, isMutating, onEdit, onDelete }) => {
  const enabledFeatures = Object.entries(plan.features ?? {}).filter(([, v]) => Boolean(v));
  const hasOnboarding   = plan.onboarding_fee.applicable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 transition-all duration-300 group/card',
        isDark
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10'
          : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10',
      )}
    >
      {/* Popular badge */}
      {plan.is_popular && (
        <div className="absolute top-3 right-3 z-10">
          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border', isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-700 border-amber-200')}>
            <Star className="w-3 h-3 fill-current" /> Popular
          </span>
        </div>
      )}

      {/* Decorative glow */}
      <div className={cn('absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none', isDark ? 'bg-blue-500/5' : 'bg-blue-500/5')} />

      <div className="relative p-5">
        {/* Top row: name + status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className={cn('text-lg font-bold truncate', isDark ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
            <code className={cn('text-xs px-2 py-0.5 rounded border inline-block mt-1 font-mono', isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500')}>
              {plan.slug}
            </code>
          </div>
          <span className={cn(
            'shrink-0 text-xs font-medium px-2 py-1 rounded-full border',
            plan.is_active
              ? isDark ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200'
              : isDark ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200',
          )}>
            {plan.is_active ? '● Active' : '○ Inactive'}
          </span>
        </div>

        {plan.description && (
          <p className={cn('text-sm line-clamp-2 mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>{plan.description}</p>
        )}

        {/* Pricing */}
        <div className={cn('rounded-xl p-3 mb-4 border', isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200')}>
          <div className="flex items-baseline justify-between">
            <div>
              <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                ${plan.pricing.usd.toLocaleString()}
              </span>
              <span className={cn('text-xs ml-1', isDark ? 'text-gray-400' : 'text-gray-500')}>/ {plan.pricing.billing_cycle}</span>
            </div>
            <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              UGX {plan.pricing.ugx.toLocaleString()}
            </span>
          </div>
          {hasOnboarding && (
            <p className={cn('text-xs mt-1.5', isDark ? 'text-amber-400' : 'text-amber-600')}>
              + ${plan.onboarding_fee.usd} onboarding fee
            </p>
          )}
        </div>

        {/* Chips: trial, limits */}
        <div className="flex flex-wrap gap-2 mb-4">
          {plan.trial_days > 0 && (
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border', isDark ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200')}>
              <Clock className="w-3 h-3" /> {plan.trial_days}d trial
            </span>
          )}
          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border', isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200')}>
            <Users className="w-3 h-3" /> {plan.limits.max_staff !== null ? `${plan.limits.max_staff} staff` : '∞ staff'}
          </span>
          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border', isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200')}>
            <Activity className="w-3 h-3" /> {plan.limits.max_patients_per_month !== null ? `${plan.limits.max_patients_per_month} pts/mo` : '∞ patients'}
          </span>
          {enabledFeatures.length > 0 && (
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border', isDark ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200')}>
              <Zap className="w-3 h-3" /> {enabledFeatures.length} features
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-dashed" style={{ borderColor: isDark ? 'rgba(75,85,99,0.4)' : 'rgba(209,213,219,0.6)' }}>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onEdit}
            disabled={isMutating}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all cursor-pointer',
              isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300',
              isMutating && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onDelete}
            disabled={isMutating}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all cursor-pointer',
              isDark ? 'bg-red-900/20 border-red-500/30 text-red-300 hover:bg-red-900/30 hover:border-red-500/50' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300',
              isMutating && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          FORM HELPER COMPONENTS                            */
/* -------------------------------------------------------------------------- */

const inputClass = (isDark: boolean, hasError: boolean, disabled: boolean) => cn(
  'w-full px-3 py-2.5 rounded-lg border-2 text-sm transition-all',
  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
  isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
  hasError && (isDark ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-red-400 focus:border-red-500 focus:ring-red-500/30'),
  disabled && 'opacity-50 cursor-not-allowed',
);

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  hint?: string;
  isDark: boolean;
  children: React.ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon, hint, isDark, children, collapsible, expanded, onToggle }) => (
  <div className={cn('rounded-xl border-2 overflow-hidden', isDark ? 'border-gray-700' : 'border-gray-200')}>
    <button
      type="button"
      onClick={collapsible ? onToggle : undefined}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 text-left',
        isDark ? 'bg-gray-800/50' : 'bg-gray-50',
        collapsible && 'cursor-pointer',
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{icon}</span>}
        <span className={cn('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-800')}>{title}</span>
        {hint && <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>— {hint}</span>}
      </div>
      {collapsible && (expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
    </button>
    <div className="p-4">{collapsible ? children : children}</div>
  </div>
);

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  isDark: boolean;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, error, hint, isDark, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint}
    </div>
    {children}
    {error && (
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />{error}
      </motion.p>
    )}
  </div>
);

interface ToggleFieldProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isDark: boolean;
  activeColor: 'green' | 'amber' | 'blue';
}

const ToggleField: React.FC<ToggleFieldProps> = ({ label, hint, value, onChange, isDark, activeColor }) => {
  const colorMap = {
    green: isDark ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-green-50 border-green-200 text-green-700',
    amber: isDark ? 'bg-amber-900/20 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700',
    blue:  isDark ? 'bg-blue-900/20 border-blue-500/30 text-blue-400'   : 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left',
        value
          ? colorMap[activeColor]
          : isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
      )}
    >
      {value ? <ToggleRight className="w-5 h-5 shrink-0" /> : <ToggleLeft className="w-5 h-5 shrink-0 text-gray-400" />}
      <div className="min-w-0">
        <p className={cn('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{label}</p>
        <p className={cn('text-xs mt-0.5 truncate', isDark ? 'text-gray-500' : 'text-gray-500')}>{hint}</p>
      </div>
    </button>
  );
};

export default FacilityPlans;

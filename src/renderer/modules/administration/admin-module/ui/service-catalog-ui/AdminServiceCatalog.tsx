// AdminServiceCatalog/AdminServiceCatalog.tsx
import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Microscope,
  Scan,
  Stethoscope,
  FileText,
  Activity,
  Brain,
  Shield,
  Syringe,
  Thermometer,
  AlertCircle,
  Tag,
} from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetServiceCatalogs,
  useCreateServiceCatalog,
  useUpdateServiceCatalog,
  useDeleteServiceCatalog,
  useRestoreServiceCatalog,
  serviceCatalogKeys,
} from '../../../../administration/admin-module/api/service-catalog/useServiceCatalogQueries';

import  {
  CreateServiceCatalogRequest,
  UpdateServiceCatalogRequest,
  ServiceCatalogFilters,
  ServiceCatalog,
  ServiceCategory,
  CodeSystem,
  RiskLevel,
  ServiceStatus,
  ServiceCatalogListResponse,
} from '../../../../administration/admin-module/api/service-catalog/serviceCatalogTypes';

import { ServiceCatalogHeader } from './components/ServiceCatalogHeader';
import { ServiceCatalogFiltersBar } from './components/ServiceCatalogFiltersBar';
import { ServiceCatalogFormDrawer, type ServiceFormData } from './components/ServiceCatalogFormDrawer';
import { ServiceCatalogList } from './components/ServiceCatalogList';

interface AdminServiceCatalogProps {
  theme: 'light' | 'dark';
}

const todayISO = () => new Date().toISOString().split('T')[0];

const emptyForm = (): ServiceFormData => ({
  service_code: '',
  service_name: '',
  service_description: '',
  service_category: ServiceCategory.CONSULTATION,
  code_system: CodeSystem.LOCAL_CUSTOM,
  currency_code: 'UGX',
  price_amount: 0,
  effective_from: todayISO(),
  effective_to: '',
  default_duration_minutes: 30,
  department_specialty: '',
  risk_level: RiskLevel.LOW,
  requires_informed_consent: false,
  status: ServiceStatus.ACTIVE,
});

type DrawerMode = 'create' | 'edit';

export const AdminServiceCatalog: React.FC<AdminServiceCatalogProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const activeContext = useAppSelector(state => state.activeContext);
  const activeFacilityId = activeContext.activeFacilityId;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [codeSystemFilter, setCodeSystemFilter] = useState<CodeSystem | 'all'>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState<number>(10);

  const [formData, setFormData] = useState<ServiceFormData>(() => emptyForm());

  // ---------------------------------------------------------------------------
  // OPTIONS (aligned to enums from serviceCatalogTypes.ts)
  // ---------------------------------------------------------------------------
  const serviceCategoryOptions: {
    value: ServiceCategory;
    label: string;
    icon: React.ElementType;
    color: string;
  }[] = useMemo(
    () => [
      { value: ServiceCategory.CONSULTATION, label: 'Consultation', icon: Stethoscope, color: 'text-blue-500' },
      { value: ServiceCategory.EVALUATION_MANAGEMENT, label: 'Evaluation & Management', icon: FileText, color: 'text-purple-500' },
      { value: ServiceCategory.DIAGNOSTIC_IMAGING, label: 'Diagnostic Imaging', icon: Scan, color: 'text-cyan-500' },
      { value: ServiceCategory.LABORATORY_TEST, label: 'Laboratory Test', icon: Microscope, color: 'text-green-500' },
      { value: ServiceCategory.SURGICAL_PROCEDURE, label: 'Surgical Procedure', icon: Activity, color: 'text-red-500' },
      { value: ServiceCategory.MEDICAL_PROCEDURE, label: 'Medical Procedure', icon: Activity, color: 'text-rose-500' },
      { value: ServiceCategory.THERAPY_SESSION, label: 'Therapy Session', icon: Brain, color: 'text-indigo-500' },
      { value: ServiceCategory.PREVENTIVE_CARE, label: 'Preventive Care', icon: Shield, color: 'text-teal-500' },
      { value: ServiceCategory.VACCINATION, label: 'Vaccination', icon: Syringe, color: 'text-yellow-500' },
      { value: ServiceCategory.MEDICATION_ADMINISTRATION, label: 'Medication Admin', icon: Thermometer, color: 'text-orange-500' },
      { value: ServiceCategory.EMERGENCY_SERVICE, label: 'Emergency Service', icon: AlertCircle, color: 'text-red-600' },
      { value: ServiceCategory.ANESTHESIA, label: 'Anesthesia', icon: Activity, color: 'text-gray-500' },
      { value: ServiceCategory.PATHOLOGY, label: 'Pathology', icon: Microscope, color: 'text-green-600' },
      { value: ServiceCategory.RADIOLOGY, label: 'Radiology', icon: Scan, color: 'text-blue-600' },
      { value: ServiceCategory.FACILITY_FEE, label: 'Facility Fee', icon: Building2, color: 'text-gray-600' },
    ],
    []
  );

  const codeSystemOptions = useMemo(
    () => [
      { value: CodeSystem.CPT, label: 'CPT' },
      { value: CodeSystem.HCPCS, label: 'HCPCS' },
      { value: CodeSystem.ICD_10_PCS, label: 'ICD-10-PCS' },
      { value: CodeSystem.CDT, label: 'CDT' },
      { value: CodeSystem.LOCAL_CUSTOM, label: 'Custom' },
    ],
    []
  );

  const riskLevelOptions = useMemo(
    () => [
      { value: RiskLevel.LOW, label: 'Low' },
      { value: RiskLevel.MODERATE, label: 'Moderate' },
      { value: RiskLevel.HIGH, label: 'High' },
      { value: RiskLevel.CRITICAL, label: 'Critical' },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: ServiceStatus.ACTIVE, label: 'Active' },
      { value: ServiceStatus.INACTIVE, label: 'Inactive' },
      { value: ServiceStatus.DEPRECATED, label: 'Deprecated' },
      { value: ServiceStatus.UNDER_REVIEW, label: 'Under Review' },
    ],
    []
  );

  const currencyOptions = useMemo(
    () => [
      { value: 'UGX', label: 'UGX - Ugandan Shilling' },
      { value: 'USD', label: 'USD - US Dollar' },
      { value: 'EUR', label: 'EUR - Euro' },
      { value: 'GBP', label: 'GBP - British Pound' },
      { value: 'KES', label: 'KES - Kenyan Shilling' },
      { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
    ],
    []
  );

  // ---------------------------------------------------------------------------
  // FILTERS (type-safe: NO "page" because backend doesn't support it)
  // ---------------------------------------------------------------------------
  const filters: ServiceCatalogFilters = useMemo(() => {
    const status =
      showDeleted
        ? undefined
        : statusFilter !== 'all'
          ? statusFilter
          : ServiceStatus.ACTIVE;

    return {
      status,
      service_category: categoryFilter !== 'all' ? categoryFilter : undefined,
      code_system: codeSystemFilter !== 'all' ? codeSystemFilter : undefined,
      effective_date: effectiveDate || undefined,
      search: searchTerm || undefined,
      per_page: perPage,
    };
  }, [showDeleted, statusFilter, categoryFilter, codeSystemFilter, effectiveDate, searchTerm, perPage]);

  const listQueryKey = useMemo(() => serviceCatalogKeys.list(filters), [filters]);

  const { data: servicesResponse, isLoading, error, refetch } = useGetServiceCatalogs(filters, {
    enabled: !!activeFacilityId,
    staleTime: 1000 * 30,
  });

  const services = servicesResponse?.data ?? [];
  const pagination = servicesResponse?.pagination;

  const setListCache = (
    updater: (current: ServiceCatalogListResponse | undefined) => ServiceCatalogListResponse | undefined
  ) => {
    queryClient.setQueryData<ServiceCatalogListResponse>(listQueryKey, updater);
  };

  // ---------------------------------------------------------------------------
  // MUTATIONS + optimistic UI (instant updates)
  // ---------------------------------------------------------------------------
  const createMutation = useCreateServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
      closeDrawer();
    },
  });

  const updateMutation = useUpdateServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
      closeDrawer();
    },
  });

  const deleteMutation = useDeleteServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
      setSelectedService(null);
    },
  });

  const restoreMutation = useRestoreServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
    },
  });

  // ---------------------------------------------------------------------------
  // Drawer handlers
  // ---------------------------------------------------------------------------
  const openCreate = () => {
    setDrawerMode('create');
    setSelectedService(null);
    setFormData(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (service: ServiceCatalog) => {
    setDrawerMode('edit');
    setSelectedService(service);

    setFormData({
      service_code: service.service_code,
      service_name: service.service_name,
      service_description: service.service_description ?? '',
      service_category: service.service_category,
      code_system: service.code_system,
      currency_code: service.currency_code,
      price_amount: Number(service.price_amount) || 0,
      effective_from: service.effective_from,
      effective_to: service.effective_to ?? '',
      default_duration_minutes: service.default_duration_minutes ?? null,
      department_specialty: service.department_specialty ?? '',
      risk_level: service.risk_level,
      requires_informed_consent: service.requires_informed_consent,
      status: service.status,
    });

    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedService(null);
    setFormData(emptyForm());
  };

  const handleDuplicate = (service: ServiceCatalog) => {
    setDrawerMode('create');
    setSelectedService(null);

    setFormData({
      service_code: `${service.service_code}-COPY`,
      service_name: `${service.service_name} (Copy)`,
      service_description: service.service_description ?? '',
      service_category: service.service_category,
      code_system: service.code_system,
      currency_code: service.currency_code,
      price_amount: Number(service.price_amount) || 0,
      effective_from: todayISO(),
      effective_to: '',
      default_duration_minutes: service.default_duration_minutes ?? null,
      department_specialty: service.department_specialty ?? '',
      risk_level: service.risk_level,
      requires_informed_consent: service.requires_informed_consent,
      status: ServiceStatus.ACTIVE,
    });

    setDrawerOpen(true);
  };

  const toggleExpand = (uuid: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Submit (instant UI -> server)
  // ---------------------------------------------------------------------------
  const handleSubmit = () => {
    if (!activeFacilityId) return;

    const payload: CreateServiceCatalogRequest = {
      service_code: formData.service_code.trim(),
      service_name: formData.service_name.trim(),
      service_category: formData.service_category,
      code_system: formData.code_system,
      currency_code: formData.currency_code,
      price_amount: Number(formData.price_amount) || 0,
      effective_from: formData.effective_from,

      service_description: formData.service_description?.trim() || undefined,
      default_duration_minutes: formData.default_duration_minutes ?? undefined,
      department_specialty: formData.department_specialty?.trim() || undefined,
      risk_level: formData.risk_level,
      requires_informed_consent: formData.requires_informed_consent,
      effective_to: formData.effective_to || undefined,
      status: formData.status,
    };

    if (drawerMode === 'create') {
      const previous = queryClient.getQueryData<ServiceCatalogListResponse>(listQueryKey);
      const now = new Date().toISOString();
      const tempUuid = `temp-${crypto.randomUUID()}`;

      const optimistic: ServiceCatalog = {
        id: -1,
        service_uuid: tempUuid,
        facility_id: Number(activeFacilityId),

        service_code: payload.service_code,
        service_name: payload.service_name,
        service_description: payload.service_description ?? null,
        service_category: payload.service_category,
        code_system: payload.code_system,

        default_duration_minutes: payload.default_duration_minutes ?? null,
        department_specialty: payload.department_specialty ?? null,
        risk_level: payload.risk_level ?? RiskLevel.LOW,
        requires_informed_consent: payload.requires_informed_consent ?? false,

        currency_code: payload.currency_code,
        price_amount: payload.price_amount,

        effective_from: payload.effective_from,
        effective_to: payload.effective_to ?? null,

        status: payload.status ?? ServiceStatus.ACTIVE,

        applicable_region: null,

        alternate_names: null,
        service_subcategories: null,
        regulatory_approval_status: null,
        required_certifications: null,
        minimum_required_credentials: null,
        required_equipment: null,
        required_facility_capabilities: null,
        typical_indications: null,
        contraindications: null,
        prerequisites: null,
        commonly_paired_services: null,
        approved_countries: null,
        state_specific_regulations: null,
        metadata: null,

        created_at: now,
        updated_at: now,
        deleted_at: null,
        created_by_staff_id: null,
      };

      setListCache((current) => {
        if (!current) return current;
        return { ...current, data: [optimistic, ...current.data] };
      });

      createMutation.mutate(payload, {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previous);
        },
      });

      return;
    }

    if (drawerMode === 'edit' && selectedService) {
      const uuid = selectedService.service_uuid;
      const previous = queryClient.getQueryData<ServiceCatalogListResponse>(listQueryKey);

      setListCache((current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map(s =>
            s.service_uuid === uuid ? { ...s, ...payload, updated_at: new Date().toISOString() } : s
          ),
        };
      });

      updateMutation.mutate(
        { uuid, data: payload as UpdateServiceCatalogRequest },
        {
          onError: () => {
            queryClient.setQueryData(listQueryKey, previous);
          },
        }
      );
    }
  };

  const handleDelete = async (service: ServiceCatalog) => {
    const confirmed = await confirm({
      title: 'Delete Service',
      message: `Are you sure you want to delete "${service.service_name}"? This action can be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    const previous = queryClient.getQueryData<ServiceCatalogListResponse>(listQueryKey);

    setListCache((current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map(s =>
          s.service_uuid === service.service_uuid ? { ...s, deleted_at: new Date().toISOString() } : s
        ),
      };
    });

    deleteMutation.mutate(
      { uuid: service.service_uuid },
      {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previous);
        },
      }
    );
  };

  const handleRestore = (service: ServiceCatalog) => {
    const previous = queryClient.getQueryData<ServiceCatalogListResponse>(listQueryKey);

    setListCache((current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map(s =>
          s.service_uuid === service.service_uuid ? { ...s, deleted_at: null } : s
        ),
      };
    });

    restoreMutation.mutate(
      { uuid: service.service_uuid },
      {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previous);
        },
      }
    );
  };

  // ---------------------------------------------------------------------------
  // Filter setters (no page reset needed since backend doesn't page)
  // ---------------------------------------------------------------------------
  const setPerPageSafe = (n: number) => {
    setPerPage(n);
  };

  const canSubmit =
    !!formData.service_code.trim() &&
    !!formData.service_name.trim() &&
    Number.isFinite(formData.price_amount) &&
    formData.price_amount > 0;

  // ---------------------------------------------------------------------------
  // Guards + loading
  // ---------------------------------------------------------------------------
  if (!activeFacilityId) {
    return (
      <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
        <Tag className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className="text-lg font-medium mb-2">No Facility Selected</h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Please select a facility from the sidebar to manage service catalog.
        </p>
      </div>
    );
  }

  if (isLoading && !servicesResponse) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading service catalog..." />;
  }

  return (
    <div className="space-y-6">
      <ServiceCatalogHeader
        theme={theme}
        services={services}
        onRefresh={() => refetch()}
        onCreate={openCreate}
        onImport={() => {
          // Hook your import modal here
          // eslint-disable-next-line no-console
          console.log('Open import dialog');
        }}
      />

      <ServiceCatalogFiltersBar
        theme={theme}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        codeSystemFilter={codeSystemFilter}
        onCodeSystemFilterChange={setCodeSystemFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        effectiveDate={effectiveDate}
        onEffectiveDateChange={setEffectiveDate}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted(v => !v)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(v => (v === 'list' ? 'grid' : 'list'))}
        perPage={perPage}
        onPerPageChange={setPerPageSafe}
        serviceCategoryOptions={serviceCategoryOptions.map(({ value, label }) => ({ value, label }))}
        codeSystemOptions={codeSystemOptions}
        statusOptions={statusOptions}
      />

      <ServiceCatalogList
        theme={theme}
        viewMode={viewMode}
        isLoading={isLoading}
        error={error ? new Error(error.message) : null}
        services={services}
        expandedServices={expandedServices}
        onToggleExpand={toggleExpand}
        onEdit={openEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onRetry={() => refetch()}
        serviceCategoryOptions={serviceCategoryOptions}
        pagination={pagination}
        onPageChange={() => {
          // Backend does not support paging => intentionally no-op.
          // Keep the UI element hidden/disabled in ServiceCatalogList if you want.
        }}
      />

      <ServiceCatalogFormDrawer
        theme={theme}
        mode={drawerMode}
        open={drawerOpen}
        currencyOptions={currencyOptions}
        codeSystemOptions={codeSystemOptions}
        riskLevelOptions={riskLevelOptions}
        statusOptions={statusOptions}
        serviceCategoryOptions={serviceCategoryOptions.map(({ value, label }) => ({ value, label }))}
        formData={formData}
        onChange={setFormData}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        canSubmit={canSubmit}
      />
    </div>
  );
};

export default AdminServiceCatalog;

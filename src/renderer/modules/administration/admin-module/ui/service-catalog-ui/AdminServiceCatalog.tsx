import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Activity,
  Layers,
  Tag,
  Upload,
  Copy,
  Shield,
  Stethoscope,
  Pill,
  Syringe,
  Brain,
  Scan,
  Microscope,
  Thermometer,Building2
} from 'lucide-react';
import { 
  useGetServiceCatalogs,
  useCreateServiceCatalog,
  useUpdateServiceCatalog,
  useDeleteServiceCatalog,
  useRestoreServiceCatalog,
  serviceCatalogKeys,
} from '../../../../administration/admin-module/api/service-catalog/useServiceCatalogQueries';
import type { 
  CreateServiceCatalogRequest,
  UpdateServiceCatalogRequest,
  ServiceCatalogFilters,
} from '../../../../administration/admin-module/api/service-catalog/serviceCatalogTypes';
import  { 
  ServiceStatus,
  RiskLevel,
  ServiceCatalog,
    ServiceCategory,
      CodeSystem,


} from '../../../../administration/admin-module/api/service-catalog/serviceCatalogTypes';

interface AdminServiceCatalogProps {
  theme: 'light' | 'dark';
}

interface ServiceFormData {
  service_code: string;
  service_name: string;
  service_description: string;
  service_category: ServiceCategory;
  code_system: CodeSystem;
  currency_code: string;
  price_amount: number;
  effective_from: string;
  effective_to: string;
  default_duration_minutes: number | null;
  department_specialty: string;
  risk_level: RiskLevel;
  requires_informed_consent: boolean;
  status: ServiceStatus;
}

export const AdminServiceCatalog: React.FC<AdminServiceCatalogProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  
  // Get active facility from context
  const activeContext = useAppSelector(state => state.activeContext);
  const activeFacilityId = activeContext.activeFacilityId;
  
  // State
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [codeSystemFilter, setCodeSystemFilter] = useState<CodeSystem | 'all'>('all');
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [showDeleted, setShowDeleted] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<string>(''); // YYYY-MM-DD
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [, setShowImportDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ServiceFormData>({
    service_code: '',
    service_name: '',
    service_description: '',
    service_category: ServiceCategory.CONSULTATION,
    code_system: CodeSystem.LOCAL_CUSTOM,
    currency_code: 'UGX',
    price_amount: 0,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    default_duration_minutes: 30,
    department_specialty: '',
    risk_level: RiskLevel.LOW,
    requires_informed_consent: false,
    status: ServiceStatus.ACTIVE,
  });
  
  // Auto-generate service code
  useEffect(() => {
    if (!formData.service_code && formData.service_name) {
      const code = formData.service_name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 8);
      setFormData(prev => ({ ...prev, service_code: code }));
    }
  }, [formData.service_name]);
  
  // Fetch service catalogs
  const filters: ServiceCatalogFilters = {
    status: showDeleted ? undefined : ServiceStatus.ACTIVE,
    service_category: categoryFilter !== 'all' ? categoryFilter : undefined,
    code_system: codeSystemFilter !== 'all' ? codeSystemFilter : undefined,
    effective_date: effectiveDate || undefined,
    search: searchTerm || undefined,
    per_page: 50,
  };
  
  const { 
    data: servicesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useGetServiceCatalogs(filters, { 
    enabled: !!activeFacilityId,
    staleTime: 1000 * 60 // 1 minute
  });
  
  const services = servicesResponse?.data || [];
  const pagination = servicesResponse?.pagination;
  
  // Mutations
  const createMutation = useCreateServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
      setIsCreating(false);
      resetForm();
    }
  });
  
  const updateMutation = useUpdateServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
      setIsEditing(false);
      setSelectedService(null);
      resetForm();
    }
  });
  
  const deleteMutation = useDeleteServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
      setSelectedService(null);
    }
  });
  
  const restoreMutation = useRestoreServiceCatalog({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all });
    }
  });
  
  // Service category options with icons
  const serviceCategoryOptions: { 
    value: ServiceCategory; 
    label: string; 
    icon: React.ElementType;
    color: string;
  }[] = [
    { value: ServiceCategory.CONSULTATION, label: 'Consultation', icon: Stethoscope, color: 'text-blue-500' },
    { value: ServiceCategory.EVALUATION_MANAGEMENT, label: 'Evaluation & Management', icon: FileText, color: 'text-purple-500' },
    { value: ServiceCategory.DIAGNOSTIC_IMAGING, label: 'Diagnostic Imaging', icon: Scan, color: 'text-cyan-500' },
    { value: ServiceCategory.LABORATORY_TEST, label: 'Laboratory Test', icon: Microscope, color: 'text-green-500' },
    { value: ServiceCategory.SURGICAL_PROCEDURE, label: 'Surgical Procedure', icon: Activity, color: 'text-red-500' },
    { value: ServiceCategory.MEDICAL_PROCEDURE, label: 'Medical Procedure', icon: Pill, color: 'text-pink-500' },
    { value: ServiceCategory.THERAPY_SESSION, label: 'Therapy Session', icon: Brain, color: 'text-indigo-500' },
    { value: ServiceCategory.PREVENTIVE_CARE, label: 'Preventive Care', icon: Shield, color: 'text-teal-500' },
    { value: ServiceCategory.VACCINATION, label: 'Vaccination', icon: Syringe, color: 'text-yellow-500' },
    { value: ServiceCategory.MEDICATION_ADMINISTRATION, label: 'Medication Admin', icon: Thermometer, color: 'text-orange-500' },
    { value: ServiceCategory.EMERGENCY_SERVICE, label: 'Emergency Service', icon: AlertCircle, color: 'text-red-600' },
    { value: ServiceCategory.ANESTHESIA, label: 'Anesthesia', icon: Activity, color: 'text-gray-500' },
    { value: ServiceCategory.PATHOLOGY, label: 'Pathology', icon: Microscope, color: 'text-green-600' },
    { value: ServiceCategory.RADIOLOGY, label: 'Radiology', icon: Scan, color: 'text-blue-600' },
    { value: ServiceCategory.FACILITY_FEE, label: 'Facility Fee', icon: Building2, color: 'text-gray-600' },
  ];
  
  // Code system options
  const codeSystemOptions = [
    { value: CodeSystem.CPT, label: 'CPT' },
    { value: CodeSystem.HCPCS, label: 'HCPCS' },
    { value: CodeSystem.ICD_10_PCS, label: 'ICD-10-PCS' },
    { value: CodeSystem.CDT, label: 'CDT' },
    { value: CodeSystem.LOCAL_CUSTOM, label: 'Custom' },
  ];
  
  // Risk level options
  const riskLevelOptions = [
    { value: RiskLevel.LOW, label: 'Low', color: 'text-green-500' },
    { value: RiskLevel.MODERATE, label: 'Moderate', color: 'text-yellow-500' },
    { value: RiskLevel.HIGH, label: 'High', color: 'text-orange-500' },
    { value: RiskLevel.CRITICAL, label: 'Critical', color: 'text-red-500' },
  ];
  
  // Status options
  const statusOptions = [
    { value: ServiceStatus.ACTIVE, label: 'Active', color: 'text-green-500' },
    { value: ServiceStatus.INACTIVE, label: 'Inactive', color: 'text-gray-500' },
    { value: ServiceStatus.DEPRECATED, label: 'Deprecated', color: 'text-red-500' },
    { value: ServiceStatus.UNDER_REVIEW, label: 'Under Review', color: 'text-yellow-500' },
  ];
  
  // Common currencies
  const currencyOptions = [
    { value: 'UGX', label: 'UGX - Ugandan Shilling' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
  ];
  
  // Helper functions
  const resetForm = () => {
    setFormData({
      service_code: '',
      service_name: '',
      service_description: '',
      service_category: ServiceCategory.CONSULTATION,
      code_system: CodeSystem.LOCAL_CUSTOM,
      currency_code: 'UGX',
      price_amount: 0,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      default_duration_minutes: 30,
      department_specialty: '',
      risk_level: RiskLevel.LOW,
      requires_informed_consent: false,
      status: ServiceStatus.ACTIVE,
    });
  };
  
  const handleEdit = (service: ServiceCatalog) => {
    setSelectedService(service);
    setFormData({
      service_code: service.service_code,
      service_name: service.service_name,
      service_description: service.service_description || '',
      service_category: service.service_category,
      code_system: service.code_system,
      currency_code: service.currency_code,
      price_amount: service.price_amount,
      effective_from: service.effective_from,
      effective_to: service.effective_to || '',
      default_duration_minutes: service.default_duration_minutes,
      department_specialty: service.department_specialty || '',
      risk_level: service.risk_level,
      requires_informed_consent: service.requires_informed_consent,
      status: service.status,
    });
    setIsEditing(true);
    setIsCreating(false);
  };
  
  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedService(null);
    resetForm();
  };
  
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedService(null);
    resetForm();
  };
  
  const handleSubmit = () => {
    if (!activeFacilityId) return;
    
    const requestData: CreateServiceCatalogRequest = {
      service_code: formData.service_code,
      service_name: formData.service_name,
      service_description: formData.service_description || undefined,
      service_category: formData.service_category,
      code_system: formData.code_system,
      currency_code: formData.currency_code,
      price_amount: formData.price_amount,
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || undefined,
      default_duration_minutes: formData.default_duration_minutes || undefined,
      department_specialty: formData.department_specialty || undefined,
      risk_level: formData.risk_level,
      requires_informed_consent: formData.requires_informed_consent,
      status: formData.status,
    };
    
    if (isEditing && selectedService) {
      updateMutation.mutate({
        uuid: selectedService.service_uuid,
        data: requestData as UpdateServiceCatalogRequest
      });
    } else {
      createMutation.mutate(requestData);
    }
  };
  
  const { confirm } = useConfirm();
  
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
  
    deleteMutation.mutate({ uuid: service.service_uuid });
  };
  
  const handleRestore = (service: ServiceCatalog) => {
    restoreMutation.mutate({ uuid: service.service_uuid });
  };
  
    const handleDuplicate = (service: ServiceCatalog) => {
      setFormData({
        service_code: `${service.service_code}-COPY`,
        service_name: `${service.service_name} (Copy)`,
        service_description: service.service_description || '',
        service_category: service.service_category,
        code_system: service.code_system,
        currency_code: service.currency_code,
        price_amount: Number(service.price_amount) || 0,
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        default_duration_minutes: service.default_duration_minutes,
        department_specialty: service.department_specialty || '',
        risk_level: service.risk_level,
        requires_informed_consent: service.requires_informed_consent,
        status: ServiceStatus.ACTIVE,
      });
      setIsCreating(true);
      setIsEditing(false);
    };

  
  const toggleExpand = (serviceUuid: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceUuid)) {
      newExpanded.delete(serviceUuid);
    } else {
      newExpanded.add(serviceUuid);
    }
    setExpandedServices(newExpanded);
  };
  
  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.ACTIVE:
        return isDark ? 'text-green-400' : 'text-green-600';
      case ServiceStatus.INACTIVE:
        return isDark ? 'text-red-400' : 'text-red-600';
      case ServiceStatus.DEPRECATED:
        return isDark ? 'text-gray-400' : 'text-gray-600';
      case ServiceStatus.UNDER_REVIEW:
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };
  
  const getStatusBgColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.ACTIVE:
        return isDark ? 'bg-green-900/30' : 'bg-green-50';
      case ServiceStatus.INACTIVE:
        return isDark ? 'bg-red-900/30' : 'bg-red-50';
      case ServiceStatus.DEPRECATED:
        return isDark ? 'bg-gray-900/30' : 'bg-gray-50';
      case ServiceStatus.UNDER_REVIEW:
        return isDark ? 'bg-yellow-900/30' : 'bg-yellow-50';
      default:
        return isDark ? 'bg-gray-900/30' : 'bg-gray-50';
    }
  };
  
  const getRiskLevelColor = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.LOW:
        return isDark ? 'text-green-400' : 'text-green-600';
      case RiskLevel.MODERATE:
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case RiskLevel.HIGH:
        return isDark ? 'text-orange-400' : 'text-orange-600';
      case RiskLevel.CRITICAL:
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };
  
        const normalizeAmount = (value: unknown): number => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
      };

    const formatPrice = (amount: unknown, currency: string) => {
      const safeAmount = normalizeAmount(amount);

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(safeAmount);
    };
    const totalRevenue = services.reduce((sum, service) => {
      return sum + normalizeAmount(service.price_amount);
    }, 0);

        const activeServices = services.filter(
          s => s.status === ServiceStatus.ACTIVE
        ).length;

        const averagePrice =
          services.length > 0 ? totalRevenue / services.length : 0;

  
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Service Catalog</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage healthcare services, pricing, and availability for your facility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Service
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Services</p>
              <p className="text-2xl font-semibold mt-1">{services.length}</p>
            </div>
            <Layers className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Services</p>
              <p className="text-2xl font-semibold mt-1">{activeServices}</p>
            </div>
            <CheckCircle className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Average Price</p>
              <p className="text-2xl font-semibold mt-1">
                {formatPrice(averagePrice, 'UGX')}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
        </div>
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
              <p className="text-2xl font-semibold mt-1">
                {formatPrice(totalRevenue, 'UGX')}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search services by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | 'all')}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Categories</option>
              {serviceCategoryOptions.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={codeSystemFilter}
              onChange={(e) => setCodeSystemFilter(e.target.value as CodeSystem | 'all')}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Code Systems</option>
              {codeSystemOptions.map(sys => (
                <option key={sys.value} value={sys.value}>
                  {sys.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'all')}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Effective Date"
              />
            </div>
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showDeleted
                  ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              {showDeleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {viewMode === 'list' ? 'Grid View' : 'List View'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Service Code *
                </label>
                <input
                  type="text"
                  value={formData.service_code}
                  onChange={(e) => setFormData({...formData, service_code: e.target.value.toUpperCase()})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g., CONSULT001"
                />
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Unique identifier for the service
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g., General Consultation"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={formData.service_description}
                  onChange={(e) => setFormData({...formData, service_description: e.target.value})}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Brief description of the service..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Service Category *
                  </label>
                  <select
                    value={formData.service_category}
                    onChange={(e) => setFormData({...formData, service_category: e.target.value as ServiceCategory})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {serviceCategoryOptions.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Code System
                  </label>
                  <select
                    value={formData.code_system}
                    onChange={(e) => setFormData({...formData, code_system: e.target.value as CodeSystem})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {codeSystemOptions.map(sys => (
                      <option key={sys.value} value={sys.value}>
                        {sys.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Currency *
                  </label>
                  <select
                    value={formData.currency_code}
                    onChange={(e) => setFormData({...formData, currency_code: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {currencyOptions.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Price Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_amount}
                      onChange={(e) => setFormData({...formData, price_amount: parseFloat(e.target.value) || 0})}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Effective From *
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({...formData, effective_from: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={(e) => setFormData({...formData, effective_to: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Default Duration (minutes)
                  </label>
                  <div className="relative">
                    <Clock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="number"
                      min="1"
                      value={formData.default_duration_minutes || ''}
                      onChange={(e) => setFormData({...formData, default_duration_minutes: e.target.value ? parseInt(e.target.value) : null})}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Department/Specialty
                  </label>
                  <input
                    type="text"
                    value={formData.department_specialty}
                    onChange={(e) => setFormData({...formData, department_specialty: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="e.g., Cardiology"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Risk Level
                  </label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => setFormData({...formData, risk_level: e.target.value as RiskLevel})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {riskLevelOptions.map(risk => (
                      <option key={risk.value} value={risk.value}>
                        {risk.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as ServiceStatus})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requires_informed_consent}
                    onChange={(e) => setFormData({...formData, requires_informed_consent: e.target.checked})}
                    className={`rounded ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    Requires Informed Consent
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.service_code || !formData.service_name || !formData.price_amount}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : isEditing ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </div>
      )}
      
      {/* Services List */}
      {viewMode === 'list' ? (
        <div className={`rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          {/* Table Header */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="grid grid-cols-12 gap-4 text-sm font-medium">
              <div className="col-span-5">Service</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center">
              <RefreshCw className={`w-8 h-8 animate-spin mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading services...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !isLoading && (
            <div className="p-8 text-center">
              <AlertCircle className={`w-8 h-8 mx-auto ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Error loading services: {error.message}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && !error && services.length === 0 && (
            <div className="p-8 text-center">
              <Tag className={`w-12 h-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className="mt-4 text-lg font-medium">No services found</h3>
              <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first service to get started'}
              </p>
            </div>
          )}
          
          {/* Services List */}
          {!isLoading && !error && services.length > 0 && (
            <div>
              {services.map((service) => {
                const CategoryIcon = serviceCategoryOptions.find(cat => cat.value === service.service_category)?.icon || Tag;
                return (
                  <div
                    key={service.service_uuid}
                    className={`p-4 border-b last:border-b-0 ${
                      isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    {/* Main Row */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(service.service_uuid)}
                            className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {expandedServices.has(service.service_uuid) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <CategoryIcon className={`w-4 h-4 ${serviceCategoryOptions.find(cat => cat.value === service.service_category)?.color}`} />
                            </div>
                            <div>
                              <div className="font-medium">{service.service_name}</div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Code: {service.service_code}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {service.service_category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="font-medium">
                          {formatPrice(service.price_amount, service.currency_code)}
                        </div>
                        {service.default_duration_minutes && (
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {service.default_duration_minutes} mins
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(service.status)} ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                      
                      <div className="col-span-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDuplicate(service)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(service)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {service.deleted_at ? (
                            <button
                              onClick={() => handleRestore(service)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-green-400 hover:text-green-300' : 'hover:bg-gray-200 text-green-600 hover:text-green-700'}`}
                              title="Restore"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(service)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-gray-200 text-red-600 hover:text-red-700'}`}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedServices.has(service.service_uuid) && (
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Service Details</h4>
                            <div className="space-y-2">
                              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                <span className="font-medium">Code System:</span> {service.code_system}
                              </div>
                              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                <span className="font-medium">Department:</span> {service.department_specialty || 'General'}
                              </div>
                              <div className={`inline-flex items-center gap-1 ${getRiskLevelColor(service.risk_level)}`}>
                                <Shield className="w-4 h-4" />
                                <span>Risk Level: {service.risk_level}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Validity Period</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                  Effective From: {service.effective_from}
                                </span>
                              </div>
                              {service.effective_to && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                    Effective To: {service.effective_to}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                {service.requires_informed_consent ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-gray-500" />
                                )}
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                  Requires Consent: {service.requires_informed_consent ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Additional Information</h4>
                            <div className="space-y-2">
                              {service.service_description && (
                                <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                  {service.service_description}
                                </div>
                              )}
                              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                Created: {new Date(service.created_at).toLocaleDateString()}
                              </div>
                              {service.updated_at !== service.created_at && (
                                <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                  Updated: {new Date(service.updated_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className={`w-8 h-8 animate-spin mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading services...</p>
            </div>
          ) : !isLoading && !error && services.length === 0 ? (
            <div className="p-8 text-center">
              <Tag className={`w-12 h-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className="mt-4 text-lg font-medium">No services found</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => {
                const CategoryIcon = serviceCategoryOptions.find(cat => cat.value === service.service_category)?.icon || Tag;
                const categoryColor = serviceCategoryOptions.find(cat => cat.value === service.service_category)?.color;
                
                return (
                  <div
                    key={service.service_uuid}
                    className={`rounded-lg border p-4 ${isDark ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-gray-300'} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{service.service_name}</h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {service.service_code}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(service.status)} ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {formatPrice(service.price_amount, service.currency_code)}
                        </span>
                        {service.default_duration_minutes && (
                          <span className={`inline-flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Clock className="w-4 h-4" />
                            {service.default_duration_minutes}m
                          </span>
                        )}
                      </div>
                      
                      {service.service_description && (
                        <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {service.service_description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {service.code_system}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs ${getRiskLevelColor(service.risk_level)}`}>
                          <Shield className="w-3 h-3" />
                          {service.risk_level}
                        </span>
                      </div>
                      
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Valid from: {service.effective_from}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(service)}
                          className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      {service.deleted_at ? (
                        <button
                          onClick={() => handleRestore(service)}
                          className={`px-3 py-1.5 rounded text-xs font-medium ${
                            isDark ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(service)}
                          className={`px-3 py-1.5 rounded text-xs font-medium ${
                            isDark ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} services
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.current_page === 1}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                pagination.current_page === 1
                  ? (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              Previous
            </button>
            <span className={`px-3 py-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              disabled={pagination.current_page === pagination.last_page}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                pagination.current_page === pagination.last_page
                  ? (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceCatalog;
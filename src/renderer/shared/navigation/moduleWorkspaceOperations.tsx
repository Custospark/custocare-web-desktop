/* eslint-disable react-refresh/only-export-components -- data module: operation specs with inline icon elements, not Fast Refresh roots */
/**
 * Canonical module workspace operations (Quick Actions / BaseModuleWorkspace) and
 * matching nested-sidebar child rows. Icons and labels must stay in sync — import
 * from here in both module shells and Sidebar menuConfig.
 */
import React from 'react';
import {
  BedDouble,
  BookOpenText,
  Boxes,
  BrainCircuit,
  Building2,
  Calendar,
  CircleHelp,
  ClipboardList,
  DoorOpen,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Compass,
  LifeBuoy,
  ListOrdered,
  MapIcon,
  Megaphone,
  MessageCircleMore,
  MessageSquareHeart,
  Package,
  Pill,
  Receipt,
  Settings,
  Stethoscope,
  Ticket,
  Users,
  UsersRound,
  Workflow,
  Download,
  Bell,
  FlaskConical,
  CreditCard,
} from 'lucide-react';
import { FaBuilding } from 'react-icons/fa';

import type { ModuleOperation } from '../components/workspace/BaseModuleWorkspace';
import { ROUTES } from '../../app/routes/routeConstants';
import {
  ACCOUNT_ROUTES,
  BILLING_ROUTES,
  CLINICAL_ROUTES,
  custocareHubActionPath,
  custocareHubOperationPath,
  LABORATORY_ROUTES,
  MEDICAL_RECORDS_ROUTES,
  NURSING_ROUTES,
  PATIENT_PORTAL_ROUTES,
  PHARMACY_ROUTES,
} from '../../app/routes/routeConstants';
import { ADMIN_ROUTES } from '../../app/routes/constants/administration.paths';
import { PLATFORM_ADMIN_ROUTES } from '../../app/routes/constants/platform-administration.paths';
import { CUSTOCARE_HUB_MODULE_OPERATIONS } from '../../modules/custocare-hub/config/hubConfig';

export type SidebarNestedOperation = {
  id: string;
  label: string;
  route: string;
  icon?: React.ReactNode;
  /** Shown as native tooltip in nested sidebar (matches QuickActions `description`). */
  description?: string;
  subtext?: string;
};

const opIcon = (node: React.ReactNode): React.ReactNode => {
  if (!React.isValidElement(node)) return node;
  return React.cloneElement(node, { 'aria-hidden': true } as React.HTMLAttributes<HTMLElement>);
};

const segment = (base: string, id: string) => `${base.replace(/\/$/, '')}/${id}`;

function mapWorkspaceToSidebar(
  ops: ModuleOperation[],
  routeByOpId: Record<string, string>,
  idPrefix: string,
): SidebarNestedOperation[] {
  return ops.map((op) => ({
    id: `${idPrefix}-${op.id}`,
    label: op.label,
    route: routeByOpId[op.id]!,
    icon: op.icon != null ? opIcon(op.icon) : undefined,
    description: op.description,
    subtext: op.subtext,
  }));
}

// ─── Medical Records ───────────────────────────────────────────────────────

export const MEDICAL_RECORDS_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Patient Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'patients',
    label: 'Patient Registry Management',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'visit-action-center',
    label: 'Patient Encounter Hub',
    icon: <Workflow className="w-4 h-4" />,
  },
  {
    id: 'revenue',
    label: 'Billing & Reconciliation',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Validate and reconcile clinical charges',
  },
];

const MEDICAL_RECORDS_NESTED_ROUTES: Record<string, string> = {
  overview: MEDICAL_RECORDS_ROUTES.OVERVIEW,
  patients: MEDICAL_RECORDS_ROUTES.PATIENTS,
  'visit-action-center': MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER,
  revenue: MEDICAL_RECORDS_ROUTES.REVENUE_INTEGRITY,
};

export const MEDICAL_RECORDS_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  MEDICAL_RECORDS_MODULE_OPERATIONS,
  MEDICAL_RECORDS_NESTED_ROUTES,
  'mr',
);

// ─── Patient portal ─────────────────────────────────────────────────────────
// REPLACED with new operations as requested

export const PATIENT_PORTAL_MODULE_OPERATIONS: ModuleOperation[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'medical-history', label: 'Medical History', icon: <FileText className="w-4 h-4" /> },
  { id: 'medications', label: 'Medications', icon: <Pill className="w-4 h-4" /> },
  { id: 'laboratory-results', label: 'Laboratory Results', icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'billing-payments', label: 'Billing & Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'downloads-reports', label: 'Downloads & Reports', icon: <Download className="w-4 h-4" /> },
];

const PATIENT_PORTAL_NESTED_ROUTES: Record<string, string> = {
  dashboard: PATIENT_PORTAL_ROUTES.DASHBOARD,
  'medical-history': PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_LATEST_VISIT,
  medications: PATIENT_PORTAL_ROUTES.MEDICATIONS,
  'laboratory-results': PATIENT_PORTAL_ROUTES.LABORATORY_RESULTS,
  'billing-payments': PATIENT_PORTAL_ROUTES.BILLING,
  appointments: PATIENT_PORTAL_ROUTES.APPOINTMENTS,
  notifications: PATIENT_PORTAL_ROUTES.NOTIFICATIONS,
  'downloads-reports': PATIENT_PORTAL_ROUTES.DOWNLOADS,
};
export const PATIENT_PORTAL_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  PATIENT_PORTAL_MODULE_OPERATIONS,
  PATIENT_PORTAL_NESTED_ROUTES,
  'pp',
);

// ─── Nursing ───────────────────────────────────────────────────────────────

export const NURSING_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Nursing Intelligence',
    icon: <BrainCircuit className="w-4 h-4" />,
    subtext: 'Volume, trends, and operational signals for nursing care',
  },
  {
    id: 'wards-patients',
    label: 'Wards & Patients',
    icon: <BedDouble className="w-4 h-4" />,
  },
  {
    id: 'nursing-encounter',
    label: 'Nursing Encounter',
    icon: <Stethoscope className="w-4 h-4" />,
  },
  {
    id: 'medication-treatment',
    label: 'Medication & Treatment',
    icon: <Pill className="w-4 h-4" />,
  },
  {
    id: 'tasks-shifts',
    label: 'Tasks & Shifts',
    icon: <ClipboardList className="w-4 h-4" />,
  },
];

const NURSING_NESTED_ROUTES: Record<string, string> = {
  overview: NURSING_ROUTES.OVERVIEW,
  'wards-patients': NURSING_ROUTES.WARDS_PATIENTS,
  'nursing-encounter': NURSING_ROUTES.NURSING_ENCOUNTER,
  'medication-treatment': NURSING_ROUTES.MEDICATION_TREATMENT,
  'tasks-shifts': NURSING_ROUTES.TASKS_SHIFTS,
};

export const NURSING_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  NURSING_MODULE_OPERATIONS,
  NURSING_NESTED_ROUTES,
  'nur',
);

// ─── Clinical ────────────────────────────────────────────────────────────────

export const CLINICAL_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Clinical Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'patients',
    label: 'Patient Registry Management',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'visit-action-center',
    label: 'Clinical Encounter Workflow',
    icon: <Workflow className="w-4 h-4" />,
  },
  {
    id: 'revenue',
    label: 'Billing & Reconciliation',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Validate and reconcile clinical charges',
  },
];

const CLINICAL_NESTED_ROUTES: Record<string, string> = {
  overview: CLINICAL_ROUTES.OVERVIEW,
  patients: CLINICAL_ROUTES.PATIENTS,
  'visit-action-center': CLINICAL_ROUTES.VISIT_ACTION_CENTER,
  revenue: CLINICAL_ROUTES.REVENUE_INTEGRITY,
};

export const CLINICAL_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  CLINICAL_MODULE_OPERATIONS,
  CLINICAL_NESTED_ROUTES,
  'cl',
);

// ─── Laboratory ─────────────────────────────────────────────────────────────

export const LABORATORY_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Laboratory Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    subtext: 'Track test volume, diagnostic workload, and lab operational performance',
  },
  {
    id: 'patients',
    label: 'Lab Intake',
    icon: <Users className="w-4 h-4" />,
    subtext: 'Queue and quick intake for patients proceeding to laboratory workflow',
  },
  {
    id: 'action-center',
    label: 'Lab Encounter Center',
    icon: <Workflow className="w-4 h-4" />,
    subtext: 'Patient context with lab request, results entry, and billing actions',
  },
  {
    id: 'catalog',
    label: 'Service & Inventory Catalog',
    icon: <ClipboardList className="w-4 h-4" />,
    subtext: 'Manage billable laboratory services and inventory items together',
  },
  {
    id: 'receipts',
    label: 'Billing & Receipts',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Review captured charges and issued receipts for laboratory encounters',
  },
];

const LABORATORY_NESTED_ROUTES: Record<string, string> = {
  overview: LABORATORY_ROUTES.OVERVIEW,
  patients: LABORATORY_ROUTES.PATIENTS,
  'action-center': LABORATORY_ROUTES.ACTION_CENTER,
  catalog: LABORATORY_ROUTES.CATALOG,
  receipts: LABORATORY_ROUTES.RECEIPTS,
};

export const LABORATORY_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  LABORATORY_MODULE_OPERATIONS,
  LABORATORY_NESTED_ROUTES,
  'lab',
);

// ─── Pharmacy ────────────────────────────────────────────────────────────────

export const PHARMACY_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Pharmacy Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    subtext: 'Volume, trends, and operational signals for the dispensary',
  },
  {
    id: 'patients',
    label: 'Queue & Patient Intake',
    icon: <Users className="w-4 h-4" />,
    subtext: 'Single entry: queue shows visits with Rx ready for dispensing; choose search, register, or walk-in',
  },
  {
    id: 'action-center',
    label: 'Medication Encounter Center',
    icon: <Workflow className="w-4 h-4" />,
    subtext: 'Active visit from slice: dispense, search & review prescriptions for this patient',
  },
  {
    id: 'inventory',
    label: 'Stock & Catalog',
    icon: <Package className="w-4 h-4" />,
    subtext: 'Items, lots, and on-hand levels',
  },
  {
    id: 'receipts',
    label: 'Billing & Receipts',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Charge review and issued receipts',
  },
];

const PHARMACY_NESTED_ROUTES: Record<string, string> = {
  overview: PHARMACY_ROUTES.OVERVIEW,
  patients: PHARMACY_ROUTES.PATIENTS,
  'action-center': PHARMACY_ROUTES.ACTION_CENTER,
  inventory: PHARMACY_ROUTES.INVENTORY,
  receipts: PHARMACY_ROUTES.RECEIPTS,
};

export const PHARMACY_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  PHARMACY_MODULE_OPERATIONS,
  PHARMACY_NESTED_ROUTES,
  'ph',
);

// ─── Billing ─────────────────────────────────────────────────────────────────

export const BILLING_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Financial Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    subtext: 'Track billing trends, collections, and operational performance',
  },
  {
    id: 'patients',
    label: 'Billing Intake',
    icon: <ListOrdered className="w-4 h-4" />,
    subtext: 'Select queue visits or quick-start walk-ins for billing',
  },
  {
    id: 'action-center',
    label: 'Billing Encounter',
    icon: <Workflow className="w-4 h-4" />,
    subtext: 'Patient context, billing actions, and encounter-level flow control',
  },
  {
    id: 'revenue',
    label: 'Receipts, Invoices & Reconciliation',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Manage receipts, derive invoices, and run reconciliation',
  },
];

/** Matches BaseModuleWorkspace navigation: `/billing/<operationId>`. */
const BILLING_NESTED_ROUTES: Record<string, string> = {
  overview: segment(ROUTES.BILLING, 'overview'),
  patients: BILLING_ROUTES.PATIENTS,
  'action-center': BILLING_ROUTES.ACTION_CENTER,
  revenue: BILLING_ROUTES.REVENUE,
};

export const BILLING_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  BILLING_MODULE_OPERATIONS,
  BILLING_NESTED_ROUTES,
  'bill',
);

// ─── Administration ──────────────────────────────────────────────────────────

export const ADMINISTRATION_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Facility Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description:
      'Comprehensive analytics dashboard with workforce, capacity, inventory, and revenue insights',
  },
  {
    id: 'facility-setup',
    label: 'Clinical Departments',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Configure departments and facility structure',
  },
  {
    id: 'clinical-space-management',
    label: 'Clinical Space Management',
    icon: <MapIcon className="w-4 h-4" />,
    description: 'Define rooms, floors, buildings, and manage staff space assignments',
  },
  {
    id: 'service-catalog',
    label: 'Clinical & Billing Services',
    icon: <Layers className="w-4 h-4" />,
    description: 'Manage services and pricing versions',
  },
  {
    id: 'inventory',
    label: 'Supply & Inventory Management',
    icon: <Boxes className="w-4 h-4" />,
    description: 'Manage stock items, locations, and inventory controls',
  },
  {
    id: 'team',
    label: 'Workforce Administration',
    icon: <Users className="w-4 h-4" />,
    description: 'Manage staff, invitations, and roles',
  },
  {
    id: 'billing-cycle-management',
    label: 'Revenue Cycle Management',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Validate and reconcile clinical charges',
  },
  {
    id: 'settings',
    label: 'Enterprise Facility Settings',
    icon: <FaBuilding className="w-4 h-4" />,
    description: 'Manage facility identity, regulatory parameters, and operational policies',
    requiredTier: 'essential' as const,
  },
];

const ADMINISTRATION_NESTED_ROUTES: Record<string, string> = {
  overview: ADMIN_ROUTES.OVERVIEW,
  'facility-setup': ADMIN_ROUTES.FACILITY_SETUP,
  'clinical-space-management': segment(ROUTES.ADMINISTRATION, 'clinical-space-management'),
  'service-catalog': ADMIN_ROUTES.SERVICE_CATALOG,
  inventory: ADMIN_ROUTES.INVENTORY,
  team: ADMIN_ROUTES.TEAM,
  'billing-cycle-management': ADMIN_ROUTES.BILLING_CYCLE,
  settings: ADMIN_ROUTES.FACILITY_SETTINGS,
};

export const ADMINISTRATION_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  ADMINISTRATION_MODULE_OPERATIONS,
  ADMINISTRATION_NESTED_ROUTES,
  'adm',
);

// ─── Platform administration ─────────────────────────────────────────────────

export const PLATFORM_ADMINISTRATION_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'facilities',
    label: 'Facility Management',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Manage all facilities across the platform',
  },
  {
    id: 'users',
    label: 'User Administration',
    icon: <Users className="w-4 h-4" />,
    description: 'Manage users, roles, and permissions globally',
  },
  {
    id: 'api-docs',
    label: 'API Documentation',
    icon: <BookOpenText className="w-4 h-4" />,
    description: 'Explore backend API endpoints by module, auth, and route metadata',
  },
  {
    id: 'learning-materials',
    label: 'Learning Materials',
    icon: <GraduationCap className="w-4 h-4" />,
    description: 'Publish hub learning videos, thumbnails, and descriptions for all users',
  },
  {
    id: 'hub-feedback',
    label: 'Hub feedback & requests',
    icon: <MessageSquareHeart className="w-4 h-4" />,
    description: 'Review feedback and feature requests submitted from the Custocare Hub',
  },
  {
    id: 'hub-support-faqs',
    label: 'Support Center FAQs',
    icon: <CircleHelp className="w-4 h-4" />,
    description: 'Author questions and answers shown in the Custocare Hub Support Center',
  },
  {
    id: 'hub-support-tickets',
    label: 'Support tickets',
    icon: <Ticket className="w-4 h-4" />,
    description: 'Handle support tickets opened from the Custocare Hub Support Center',
  },
  {
    id: 'hub-product-updates',
    label: 'Hub product updates',
    icon: <Megaphone className="w-4 h-4" />,
    description: 'Publish read-only announcements shown under Custocare Hub → Community → Product updates',
  },
];

const PLATFORM_ADMIN_NESTED_ROUTES: Record<string, string> = {
  facilities: PLATFORM_ADMIN_ROUTES.FACILITIES,
  users: PLATFORM_ADMIN_ROUTES.USERS,
  'api-docs': PLATFORM_ADMIN_ROUTES.API_DOCS,
  'learning-materials': PLATFORM_ADMIN_ROUTES.LEARNING_MATERIALS,
  'hub-feedback': PLATFORM_ADMIN_ROUTES.HUB_FEEDBACK,
  'hub-support-faqs': PLATFORM_ADMIN_ROUTES.HUB_SUPPORT_FAQS,
  'hub-support-tickets': PLATFORM_ADMIN_ROUTES.HUB_SUPPORT_TICKETS,
  'hub-product-updates': PLATFORM_ADMIN_ROUTES.HUB_PRODUCT_UPDATES,
};

export const PLATFORM_ADMINISTRATION_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  PLATFORM_ADMINISTRATION_MODULE_OPERATIONS,
  PLATFORM_ADMIN_NESTED_ROUTES,
  'pa',
);

// ─── Custocare Hub ───────────────────────────────────────────────────────────

const HUB_ICON_BY_ID: Record<string, React.ReactNode> = {
  'learning-center': <GraduationCap className="w-4 h-4" />,
  community: <UsersRound className="w-4 h-4" />,
  'support-center': <LifeBuoy className="w-4 h-4" />,
  'feedback-requests': <MessageSquareHeart className="w-4 h-4" />,
};

export const CUSTOCARE_HUB_WORKSPACE_OPERATIONS: ModuleOperation[] = CUSTOCARE_HUB_MODULE_OPERATIONS.map(
  (op) => ({
    id: op.id,
    label: op.label,
    icon: HUB_ICON_BY_ID[op.id] ?? <Compass className="w-4 h-4" />,
  }),
);

export const CUSTOCARE_HUB_SIDEBAR_NESTED_OPERATIONS: SidebarNestedOperation[] =
  CUSTOCARE_HUB_MODULE_OPERATIONS.map((op) => {
    const glyph = HUB_ICON_BY_ID[op.id] ?? <Compass className="w-4 h-4" />;
    const defaultAction = op.usesHorizontalActions && op.actions[0];
    const description = defaultAction ? `${op.label}: ${defaultAction.label}` : op.label;
    return {
      id: `hub-${op.id}`,
      label: op.label,
      route:
        op.usesHorizontalActions && op.actions[0]
          ? custocareHubActionPath(op.id, op.actions[0].pathSegment)
          : custocareHubOperationPath(op.id),
      icon: opIcon(glyph),
      description,
    };
  });

// ─── Account (base tabs; welcome tab is dynamic in AccountModule) ───────────

export const ACCOUNT_BASE_MODULE_OPERATIONS: ModuleOperation[] = [
  { id: 'settings', label: 'Account Center', icon: <Settings className="w-4 h-4" /> },
  { id: 'messages', label: 'Message Center', icon: <MessageCircleMore className="w-4 h-4" /> },
  { id: 'invitations', label: 'Access & Invitations', icon: <DoorOpen className="w-4 h-4" /> },
];

const ACCOUNT_BASE_NESTED_ROUTES: Record<string, string> = {
  settings: segment(ROUTES.ACCOUNT, 'settings'),
  messages: ACCOUNT_ROUTES.MESSAGES,
  invitations: ACCOUNT_ROUTES.INVITATIONS,
};

export const ACCOUNT_BASE_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  ACCOUNT_BASE_MODULE_OPERATIONS,
  ACCOUNT_BASE_NESTED_ROUTES,
  'acc',
);
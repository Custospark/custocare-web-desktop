import { type Operation } from '../../../components/content/ContentLayout';
import { Home, Building2, Users, GitBranch, Building } from 'lucide-react';

export const FACILITY_OPERATIONS: Operation[] = [
  {
    id: 'overview',
    label: 'Facility Overview',
    icon: <Home className="w-4 h-4" />,
    description: 'Facility dashboard and status overview',
  },
  {
    id: 'registration',
    label: 'Facility Registration',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Register new healthcare facility',
  },
  {
    id: 'departments',
    label: 'Department Configuration',
    icon: <Building className="w-4 h-4" />,
    description: 'Configure departments and patient routing',
  },
  {
    id: 'staff',
    label: 'Staff Onboarding',
    icon: <Users className="w-4 h-4" />,
    description: 'Onboard and assign staff members',
  },
  {
    id: 'workflows',
    label: 'Workflow Customization',
    icon: <GitBranch className="w-4 h-4" />,
    description: 'Customize clinical and operational workflows',
  },
];

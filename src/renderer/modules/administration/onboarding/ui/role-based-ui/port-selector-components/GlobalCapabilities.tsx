/**
 * ============================================================================
 * GLOBAL CAPABILITIES COMPONENT
 * ============================================================================
 * Displays Spatie role capabilities that aren't tied to facilities
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Globe,
  Settings,
  Lock,
  Award,
  Zap,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import { WorkspaceCard } from './WorkspaceCard';
import { getRoleDisplayName } from '../../../../../../app/store/slices/activeContextSlice';

interface GlobalCapabilitiesProps {
  capabilities: string[];
  theme: 'light' | 'dark';
  onSelectCapability: (capabilityName: string) => void;
}

// Map capability names to icons, gradients, and human descriptions
const capabilityConfig: Record<string, { icon: LucideIcon; gradient: string; description: string; benefits: string[] }> = {
  super_admin: {
    icon: Shield,
    gradient: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    description: 'Oversee everything. Control what matters. Keep the system running smoothly.',
    benefits: ['Full platform visibility', 'System-wide settings', 'User permissions'],
  },
  admin: {
    icon: Settings,
    gradient: 'bg-gradient-to-br from-slate-500 to-gray-500',
    description: 'Manage day-to-day operations. Configure workflows. Keep teams moving.',
    benefits: ['Operational control', 'Workflow configuration', 'Team support'],
  },
  regulator: {
    icon: Award,
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
    description: 'Ensure compliance. Monitor quality. Protect standards across every facility.',
    benefits: ['Compliance oversight', 'Quality monitoring', 'Audit-ready reports'],
  },
  auditor: {
    icon: ClipboardCheck,
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    description: 'Review activity. Track changes. Maintain integrity across the platform.',
    benefits: ['Complete audit trails', 'Change history', 'System integrity'],
  },
  // Default for any other Spatie roles
  default: {
    icon: Zap,
    gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    description: 'Your specialized workspace. Everything you need, nothing you don\'t.',
    benefits: ['Tailored tools', 'Focused workflows', 'Quick access'],
  },
};

export const GlobalCapabilities: React.FC<GlobalCapabilitiesProps> = ({
  capabilities,
  theme,
  onSelectCapability,
}) => {
  if (capabilities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mb-8 sm:mb-12"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center',
            'bg-purple-500/10'
          )}
        >
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2
          className={cn(
            'text-lg sm:text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}
        >
          Platform Leadership
        </h2>
      </div>

      {/* Capability Cards */}
      <div className="space-y-3 sm:space-y-4">
        {capabilities.map((capabilityName) => {
          const config = capabilityConfig[capabilityName] || capabilityConfig.default;
          const Icon = config.icon;
          const displayName = getRoleDisplayName(capabilityName);
          
          // Use benefits from config
          const features = config.benefits.map((benefit) => ({
            icon: Lock,
            label: benefit,
          }));

          return (
            <WorkspaceCard
              key={capabilityName}
              id={capabilityName}
              title={displayName}
              subtitle="Global Access"
              description={config.description}
              icon={Icon}
              iconGradient={config.gradient}
              buttonText={`Enter ${displayName}`}
              buttonGradient="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              features={features}
              badges={[
                { label: 'Global', variant: 'primary' as const },
                { label: 'Active', variant: 'success' as const, animated: true },
              ]}
              theme={theme}
              onClick={() => onSelectCapability(capabilityName)}
            />
          );
        })}
      </div>
    </motion.div>
  );
};
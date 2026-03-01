import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Briefcase, Hospital, Award, CheckCircle2,
} from 'lucide-react';
import { FormInput, FormSelect } from './FormElements';
import { 
  NATURE_OF_FACILITY_OPTIONS, 
  FACILITY_TYPE_OPTIONS, 
  FACILITY_TYPE_LABELS,
  FACILITY_TIER_OPTIONS,
  FACILITY_TIER_LABELS,
  type FacilityFormData 
} from './types';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface Step1IdentityProps {
  formData: FacilityFormData;
  updateField: (field: keyof FacilityFormData, value: string) => void;
  theme: string;
}

export const Step1Identity: React.FC<Step1IdentityProps> = ({
  formData,
  updateField,
  theme
}) => {
  return (
    <motion.div 
      key="step-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      {/* Compact Header */}
      <div className="text-center mb-2">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          Basic information about your healthcare facility
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          field="facility_name"
          label="Facility Name"
          placeholder="e.g., Memorial Medical Center"
          icon={<Building2 className="w-4 h-4" />}
          value={formData.facility_name}
          onChange={(value) => updateField('facility_name', value)}
          theme={theme}
          showError={!formData.facility_name}
        />
        <FormInput
          field="legal_entity_name"
          label="Legal Entity Name"
          placeholder="e.g., Healthcare Systems Inc."
          icon={<Briefcase className="w-4 h-4" />}
          value={formData.legal_entity_name}
          onChange={(value) => updateField('legal_entity_name', value)}
          theme={theme}
          showError={!formData.legal_entity_name}
        />
      </div>

      {/* Nature of Facility */}
      <div className="space-y-2">
        <label className={cn(
          "block text-sm font-semibold",
          theme === 'dark' ? "text-slate-200" : "text-slate-800"
        )}>
          Nature of Facility <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {NATURE_OF_FACILITY_OPTIONS.map(option => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => updateField('nature_of_facility', option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex flex-col items-center gap-2 px-2 py-3 rounded-lg border-2 transition-all",
                formData.nature_of_facility === option.value
                  ? "border-blue-500 bg-linear-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 shadow-md"
                  : theme === 'dark'
                  ? "border-slate-700 hover:border-blue-500/50 bg-slate-800/30"
                  : "border-slate-200 hover:border-blue-400/50 bg-white hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                formData.nature_of_facility === option.value
                  ? "bg-linear-to-br from-blue-600 to-emerald-600 text-white"
                  : theme === 'dark'
                  ? "bg-slate-700 text-slate-400"
                  : "bg-slate-100 text-slate-600"
              )}>
                {option.icon}
              </div>
              
              <div className="text-center">
                <span className={cn(
                  "text-[10px] font-bold block",
                  formData.nature_of_facility === option.value
                    ? "text-blue-600 dark:text-blue-400"
                    : theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {option.label}
                </span>
              </div>

              {formData.nature_of_facility === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Classification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          value={formData.facility_type}
          onChange={(value) => updateField('facility_type', value)}
          label="Facility Type"
          options={FACILITY_TYPE_OPTIONS.map(type => ({
            value: type,
            label: FACILITY_TYPE_LABELS[type]
          }))}
          icon={<Hospital className="w-4 h-4" />}
          theme={theme}
        />
        
        <FormSelect
          value={formData.facility_tier}
          onChange={(value) => updateField('facility_tier', value)}
          label="Care Level"
          options={FACILITY_TIER_OPTIONS.map(tier => ({
            value: tier,
            label: FACILITY_TIER_LABELS[tier]
          }))}
          icon={<Award className="w-4 h-4" />}
          theme={theme}
        />
      </div>
    </motion.div>
  );
};
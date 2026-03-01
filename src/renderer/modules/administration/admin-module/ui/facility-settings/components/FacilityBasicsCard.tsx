import React from 'react';
import { Settings } from 'lucide-react';
import { NatureOfFacility, FacilityType, FacilityTier } from  '../../../api/facility-settings/FacilitySettingsTypes';
import { Label, FieldError, inputBase, textareaBase, divider } from './FormUtils';
import { cn } from '../../../../../../shared/utils/classNameUtils';
interface FacilityBasicsCardProps {
  isDark: boolean;
  editMode: boolean;
  form: any; // Using any for brevity, but should be typed properly
  fieldErrors: Record<string, string>;
  onField: <K extends keyof any>(key: K, value: any) => void;
}

export const FacilityBasicsCard: React.FC<FacilityBasicsCardProps> = ({
  isDark,
  editMode,
  form,
  fieldErrors,
  onField,
}) => {
  // Helper to display arrays in a user-friendly way
  const displayArray = (arr: any[] | null): string => {
    if (!arr || arr.length === 0) return 'None';
    return arr.map(item => 
      typeof item === 'string' 
        ? item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : String(item)
    ).join(', ');
  };

  return (
    <section className={cn(
      "rounded-xl border p-6",
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
    )}>
      <div className="flex items-center gap-2 mb-4">
        <span className={cn(
          "p-1.5 rounded-lg",
          isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
        )}>
          <Settings className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Basic Information</h3>
      </div>

      <div className={divider(isDark)} />

      {editMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {/* Facility Name */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Facility Name <span className="text-red-500">*</span></Label>
            <input
              className={inputBase(isDark)}
              value={form.facility_name}
              maxLength={200}
              onChange={(e) => onField('facility_name', e.target.value)}
              placeholder="e.g., Memorial Medical Center"
            />
            {fieldErrors.facility_name && <FieldError msg={fieldErrors.facility_name} />}
          </div>

          {/* Legal Entity Name */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Legal Entity Name</Label>
            <input
              className={inputBase(isDark)}
              value={form.legal_entity_name}
              maxLength={200}
              onChange={(e) => onField('legal_entity_name', e.target.value)}
              placeholder="e.g., Healthcare Systems Inc."
            />
            {fieldErrors.legal_entity_name && <FieldError msg={fieldErrors.legal_entity_name} />}
          </div>

          {/* Health System Name */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Health System Name (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.health_system_name}
              maxLength={200}
              onChange={(e) => onField('health_system_name', e.target.value)}
              placeholder="e.g., Regional Health Alliance"
            />
            {fieldErrors.health_system_name && <FieldError msg={fieldErrors.health_system_name} />}
          </div>

          {/* Nature of Facility */}
          <div>
            <Label isDark={isDark}>Nature of Facility</Label>
            <select
              className={inputBase(isDark)}
              value={form.nature_of_facility}
              onChange={(e) => onField('nature_of_facility', e.target.value)}
            >
              <option value="">Select nature</option>
              {Object.values(NatureOfFacility).map((v) => (
                <option key={v} value={v}>
                  {v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Facility Type */}
          <div>
            <Label isDark={isDark}>Facility Type</Label>
            <select
              className={inputBase(isDark)}
              value={form.facility_type}
              onChange={(e) => onField('facility_type', e.target.value)}
            >
              <option value="">Select type</option>
              {Object.values(FacilityType).map((v) => (
                <option key={v} value={v}>
                  {v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Facility Tier */}
          <div>
            <Label isDark={isDark}>Care Level</Label>
            <select
              className={inputBase(isDark)}
              value={form.facility_tier}
              onChange={(e) => onField('facility_tier', e.target.value)}
            >
              <option value="">Select level</option>
              {Object.values(FacilityTier).map((v) => (
                <option key={v} value={v}>
                  {v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Bed Capacity */}
          <div>
            <Label isDark={isDark}>Bed Capacity (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.bed_capacity}
              onChange={(e) => onField('bed_capacity', e.target.value)}
              placeholder="e.g., 250"
              inputMode="numeric"
            />
            {fieldErrors.bed_capacity && <FieldError msg={fieldErrors.bed_capacity} />}
          </div>

          {/* Available Services */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Available Services</Label>
            <textarea
              className={textareaBase(isDark)}
              value={form.available_services_json}
              onChange={(e) => onField('available_services_json', e.target.value)}
              placeholder='e.g., ["emergency", "outpatient", "inpatient"]'
              rows={3}
            />
            <p className={cn(
              "text-xs mt-1",
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              Enter as JSON array or comma-separated values
            </p>
            {fieldErrors.available_services_json && <FieldError msg={fieldErrors.available_services_json} />}
          </div>

          {/* Specialty Services */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Specialty Services (Optional)</Label>
            <textarea
              className={textareaBase(isDark)}
              value={form.specialty_services_json}
              onChange={(e) => onField('specialty_services_json', e.target.value)}
              placeholder='e.g., ["cardiology", "oncology", "neurology"] or null'
              rows={3}
            />
            {fieldErrors.specialty_services_json && <FieldError msg={fieldErrors.specialty_services_json} />}
          </div>

          {/* Equipment Inventory */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Equipment Inventory (Optional)</Label>
            <textarea
              className={textareaBase(isDark)}
              value={form.equipment_inventory_summary_json}
              onChange={(e) => onField('equipment_inventory_summary_json', e.target.value)}
              placeholder='e.g., ["MRI", "CT Scanner", "X-Ray"] or null'
              rows={3}
            />
            {fieldErrors.equipment_inventory_summary_json && (
              <FieldError msg={fieldErrors.equipment_inventory_summary_json} />
            )}
          </div>
        </div>
      ) : (
        <div className="pt-4 space-y-3">
          <InfoRow label="Facility Name" value={form.facility_name} isDark={isDark} />
          <InfoRow label="Legal Entity" value={form.legal_entity_name} isDark={isDark} />
          <InfoRow label="Health System" value={form.health_system_name} isDark={isDark} />
          <InfoRow 
            label="Nature" 
            value={form.nature_of_facility?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
            isDark={isDark} 
          />
          <InfoRow 
            label="Type" 
            value={form.facility_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
            isDark={isDark} 
          />
          <InfoRow 
            label="Care Level" 
            value={form.facility_tier?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
            isDark={isDark} 
          />
          <InfoRow label="Bed Capacity" value={form.bed_capacity} isDark={isDark} />
          
          {/* Services with proper formatting */}
          {(() => {
            try {
              const services = JSON.parse(form.available_services_json);
              return (
                <InfoRow 
                  label="Available Services" 
                  value={displayArray(services)} 
                  isDark={isDark} 
                />
              );
            } catch {
              return (
                <InfoRow 
                  label="Available Services" 
                  value={form.available_services_json} 
                  isDark={isDark} 
                />
              );
            }
          })()}

          {(() => {
            try {
              const specialties = JSON.parse(form.specialty_services_json);
              if (specialties) {
                return (
                  <InfoRow 
                    label="Specialty Services" 
                    value={displayArray(specialties)} 
                    isDark={isDark} 
                  />
                );
              }
            } catch {
              // Ignore parse errors
            }
            return null;
          })()}
        </div>
      )}
    </section>
  );
};

// Helper component for displaying info rows
const InfoRow: React.FC<{ label: string; value: any; isDark: boolean }> = ({ label, value, isDark }) => {
  if (!value || value === '') return null;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className={cn(
        "text-xs font-semibold uppercase tracking-wider sm:w-32 shrink-0",
        isDark ? 'text-gray-400' : 'text-gray-500'
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm",
        isDark ? 'text-gray-200' : 'text-gray-700'
      )}>
        {value}
      </span>
    </div>
  );
};
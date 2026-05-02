import React from 'react';
import {
  Activity,
  AlertTriangle,
  Download,
  Eye,
  FilePenLine,
  Printer,
  Thermometer,
  Heart,
  Droplet,
  Ruler,
  Weight,
  Brain,
  UserRound,
} from 'lucide-react';
import { FaLungs } from 'react-icons/fa';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  formatVitalsDate,
  getBmiCategory,
  getVitalsMeta,
} from './vitalsForm.utils';
import type {
  VitalResponse,
  VitalsThemeTokens,
  DynamicCustomFields,
} from './vitalsForm.types';

interface VitalsSummaryCardProps {
  isDark: boolean;
  colors: VitalsThemeTokens;
  vitals: VitalResponse;
  customFields: DynamicCustomFields;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export const VitalsSummaryCard: React.FC<VitalsSummaryCardProps> = ({
  isDark,
  colors,
  vitals,
  customFields,
  onEdit,
  onPreview,
  onPrint,
  onDownload,
}) => {
  const meta = getVitalsMeta(vitals);
  const bmiCategory = getBmiCategory(vitals.bmi);

  return (
    <section
      className={cn(
        'rounded-2xl border mb-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      {/* Header */}
      <div className={cn('border-b p-5 sm:p-6', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className={cn('h-5 w-5', colors.text.brand)} />
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                Vital Signs Record
              </h3>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  'rounded-full px-3 py-1 font-medium',
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                )}
              >
                Measured: {formatVitalsDate(meta.measuredAt || meta.createdAt)}
              </span>

             

              <span
                className={cn(
                  'rounded-full px-3 py-1 font-medium',
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                )}
              >
                Visit ID: {meta.visitId ?? 'N/A'}
              </span>
            </div>

            {/* Clinical Alert */}
          {vitals.clinical_alert && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>{vitals.clinical_alert}</span>
          </div>
        )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.primary,
                colors.bg.hover
              )}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={onDownload}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                isDark
                  ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              )}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            <button
              type="button"
              onClick={onEdit}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                isDark
                  ? 'border-amber-800/50 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              )}
            >
              <FilePenLine className="h-4 w-4" />
              Edit Vitals
            </button>
          </div>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {/* Temperature */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Thermometer className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Temperature</span>
            </div>
            <p className={cn('mt-1 text-lg font-semibold', colors.text.primary)}>
              {vitals.temperature ? `${vitals.temperature}°${vitals.temperature_unit === 'celsius' ? 'C' : 'F'}` : '—'}
            </p>
            {vitals.has_fever && (
              <span className="text-xs text-red-500">Fever</span>
            )}
            {vitals.is_hypothermic && (
              <span className="text-xs text-blue-500">Hypothermia</span>
            )}
          </div>

          {/* Heart Rate */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Heart className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Heart Rate</span>
            </div>
            <p className={cn('mt-1 text-lg font-semibold', colors.text.primary)}>
              {vitals.heart_rate ? `${vitals.heart_rate} bpm` : '—'}
            </p>
            {vitals.is_tachycardic && <span className="text-xs text-orange-500">Tachycardia</span>}
            {vitals.is_bradycardic && <span className="text-xs text-blue-500">Bradycardia</span>}
          </div>

          {/* Respiratory Rate */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <FaLungs className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Respiratory Rate</span>
            </div>
            <p className={cn('mt-1 text-lg font-semibold', colors.text.primary)}>
              {vitals.respiratory_rate ? `${vitals.respiratory_rate}/min` : '—'}
            </p>
            {vitals.is_tachypneic && <span className="text-xs text-orange-500">Tachypnea</span>}
          </div>

          {/* Blood Pressure */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Activity className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Blood Pressure</span>
            </div>
            <p className={cn('mt-1 text-lg font-semibold', colors.text.primary)}>
              {vitals.systolic_bp && vitals.diastolic_bp 
                ? `${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg` 
                : '—'}
            </p>
            {vitals.is_hypertensive && <span className="text-xs text-orange-500">Hypertensive</span>}
          </div>

          {/* Oxygen Saturation */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Droplet className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>SpO2</span>
            </div>
            <p className={cn('mt-1 text-lg font-semibold', colors.text.primary)}>
              {vitals.oxygen_saturation ? `${vitals.oxygen_saturation}%` : '—'}
            </p>
            {vitals.is_hypoxic && <span className="text-xs text-red-500">Hypoxic</span>}
          </div>

          {/* Pain Score */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Brain className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Pain Score</span>
            </div>
            <p className={cn('mt-1 text-lg font-semibold', colors.text.primary)}>
              {vitals.pain_score !== null ? `${vitals.pain_score}/10` : '—'}
            </p>
            {vitals.pain_score && vitals.pain_score >= 7 && (
              <span className="text-xs text-red-500">Severe Pain</span>
            )}
          </div>
        </div>

        {/* Anthropometrics Row */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Height */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Ruler className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Height</span>
            </div>
            <p className={cn('mt-1 text-base font-semibold', colors.text.primary)}>
              {vitals.height ? `${vitals.height} ${vitals.height_unit}` : '—'}
            </p>
          </div>

          {/* Weight */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Weight className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Weight</span>
            </div>
            <p className={cn('mt-1 text-base font-semibold', colors.text.primary)}>
              {vitals.weight ? `${vitals.weight} ${vitals.weight_unit}` : '—'}
            </p>
          </div>

          {/* BMI */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Activity className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>BMI</span>
            </div>
            <p className={cn('mt-1 text-base font-semibold', colors.text.primary)}>
              {vitals.bmi !== null ? vitals.bmi : '—'}
            </p>
            {bmiCategory && (
              <span className="text-xs text-slate-500">{bmiCategory}</span>
            )}
          </div>

          {/* MAP */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Activity className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>MAP</span>
            </div>
            <p className={cn('mt-1 text-base font-semibold', colors.text.primary)}>
              {vitals.map !== null ? `${vitals.map} mmHg` : '—'}
            </p>
          </div>
        </div>

        {/* Consciousness Level & General Appearance */}
        {(vitals.consciousness_level || vitals.general_appearance) && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vitals.consciousness_level && (
              <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                <span className={cn('text-xs font-medium', colors.text.secondary)}>Consciousness Level</span>
                <p className={cn('mt-1 text-sm font-medium', colors.text.primary)}>
                  {vitals.consciousness_level?.charAt(0).toUpperCase() + vitals.consciousness_level?.slice(1)}
                </p>
              </div>
            )}
            {vitals.general_appearance && (
              <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                <span className={cn('text-xs font-medium', colors.text.secondary)}>General Appearance</span>
                <p className={cn('mt-1 text-sm', colors.text.primary)}>{vitals.general_appearance}</p>
              </div>
            )}
          </div>
        )}

        {/* Custom Fields Section */}
        {customFields.length > 0 && (
          <div className="mt-4">
            <h4 className={cn('mb-3 text-sm font-semibold', colors.text.primary)}>
              Additional Measurements
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {customFields.map((field) => (
                <div
                  key={field.id}
                  className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}
                >
                  <span className={cn('text-xs font-medium', colors.text.secondary)}>
                    {field.label}
                  </span>
                  <p className={cn('mt-1 text-sm font-medium', colors.text.primary)}>
                    {field.value !== null && field.value !== '' ? String(field.value) : '—'}
                    {field.unit && ` ${field.unit}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinician Info */}
        {meta.staffName && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <UserRound className={cn('h-4 w-4', colors.text.tertiary)} />
            <span className={colors.text.secondary}>Recorded by:</span>
            <span className={cn('font-medium', colors.text.primary)}>{meta.staffName}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default VitalsSummaryCard;
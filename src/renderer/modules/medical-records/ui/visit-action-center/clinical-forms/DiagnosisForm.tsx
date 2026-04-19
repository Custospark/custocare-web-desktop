// DiagnosisForm.tsx - Remove the outer header, keep only the form content
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Save, X, AlertCircle } from 'lucide-react';

interface DiagnosisFormProps {
  theme?: 'light' | 'dark';
  initialData?: {
    primaryDiagnosis?: string;
    secondaryDiagnosis?: string;
    notes?: string;
  };
  onSave?: (data: DiagnosisFormData) => void;
  onCancel?: () => void;
}

export interface DiagnosisFormData {
  primaryDiagnosis: string;
  secondaryDiagnosis: string;
  notes: string;
}

export const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ 
  theme = 'light', 
  initialData,
  onSave,
  onCancel 
}) => {
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState<DiagnosisFormData>({
    primaryDiagnosis: initialData?.primaryDiagnosis || '',
    secondaryDiagnosis: initialData?.secondaryDiagnosis || '',
    notes: initialData?.notes || '',
  });

  const colors = {
    bg: {
      input: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
    },
  };

  const handleChange = useCallback((
    field: keyof DiagnosisFormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryDiagnosis.trim()) {
      return;
    }
    onSave?.(formData);
  }, [formData, onSave]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`rounded-lg p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
              Diagnosis
            </h2>
            <p className={`text-sm ${colors.text.secondary}`}>
              Record primary and secondary diagnoses
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Diagnosis */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Primary Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.primaryDiagnosis}
              onChange={(e) => handleChange('primaryDiagnosis', e.target.value)}
              placeholder="e.g., Acute Bronchitis, Hypertension, Diabetes Type 2"
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
              autoFocus
            />
          </div>

          {/* Secondary Diagnosis */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Secondary Diagnosis <span className={`text-xs ${colors.text.tertiary}`}>(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.secondaryDiagnosis}
              onChange={(e) => handleChange('secondaryDiagnosis', e.target.value)}
              placeholder="e.g., Allergic Rhinitis, Obesity, Anxiety"
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Clinical Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional clinical notes, observations, or comments..."
              rows={4}
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
            />
          </div>

          {/* Validation Hint */}
          {!formData.primaryDiagnosis.trim() && (
            <div className={`flex items-center gap-2 rounded-lg p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
              <AlertCircle className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                Primary diagnosis is required before saving
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${colors.bg.hover} ${colors.text.secondary}`}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.primaryDiagnosis.trim()}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                formData.primaryDiagnosis.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed text-gray-200'
              }`}
            >
              <Save className="h-4 w-4" />
              Save Diagnosis
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default DiagnosisForm;
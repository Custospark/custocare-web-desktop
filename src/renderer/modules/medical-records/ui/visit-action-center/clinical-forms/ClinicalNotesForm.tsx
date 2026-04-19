// ClinicalNotesForm.tsx
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, X } from 'lucide-react';

interface ClinicalNotesFormProps {
  theme?: 'light' | 'dark';
  initialData?: {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    pastMedicalHistory?: string;
    observations?: string;
    clinicalNotes?: string;
  };
  onSave?: (data: ClinicalNotesFormData) => void;
  onCancel?: () => void;
}

export interface ClinicalNotesFormData {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  observations: string;
  clinicalNotes: string;
}

export const ClinicalNotesForm: React.FC<ClinicalNotesFormProps> = ({ 
  theme = 'light', 
  initialData,
  onSave,
  onCancel 
}) => {
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState<ClinicalNotesFormData>({
    chiefComplaint: initialData?.chiefComplaint || '',
    historyOfPresentIllness: initialData?.historyOfPresentIllness || '',
    pastMedicalHistory: initialData?.pastMedicalHistory || '',
    observations: initialData?.observations || '',
    clinicalNotes: initialData?.clinicalNotes || '',
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
    field: keyof ClinicalNotesFormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
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
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
              Clinical Notes
            </h2>
            <p className={`text-sm ${colors.text.secondary}`}>
              Record patient symptoms, history, and examination findings
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chief Complaint */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Chief Complaint <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.chiefComplaint}
              onChange={(e) => handleChange('chiefComplaint', e.target.value)}
              placeholder="e.g., Fever, cough, and difficulty breathing for 3 days..."
              rows={3}
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
              autoFocus
            />
          </div>

          {/* History of Present Illness */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              History of Present Illness
            </label>
            <textarea
              value={formData.historyOfPresentIllness}
              onChange={(e) => handleChange('historyOfPresentIllness', e.target.value)}
              placeholder="Detailed chronological account of the patient's symptoms and progression..."
              rows={4}
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
            />
          </div>

          {/* Past Medical History */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Past Medical History
            </label>
            <textarea
              value={formData.pastMedicalHistory}
              onChange={(e) => handleChange('pastMedicalHistory', e.target.value)}
              placeholder="Previous illnesses, surgeries, chronic conditions, medications..."
              rows={3}
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
            />
          </div>

          {/* Physical Examination Findings */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Physical Examination Findings
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
              placeholder="Vitals, general appearance, system-specific findings..."
              rows={4}
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
            />
          </div>

          {/* Additional Clinical Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Additional Clinical Notes
            </label>
            <textarea
              value={formData.clinicalNotes}
              onChange={(e) => handleChange('clinicalNotes', e.target.value)}
              placeholder="Any other relevant information, assessment, or plan..."
              rows={3}
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
              className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Clinical Notes
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ClinicalNotesForm;
// LabResultForm.tsx
import React, { useState, useCallback } from 'react';
import { ClipboardList, Upload } from 'lucide-react';
import { BaseFormWrapper } from './components/BaseFormWrapper';
import { BaseFormActions } from './components/BaseFormActions';
import { BaseTextField } from './components/BaseTextField';

interface LabResultFormProps {
  theme?: 'light' | 'dark';
  initialData?: {
    testName?: string;
    resultDate?: string;
    resultValue?: string;
    referenceRange?: string;
    interpretation?: string;
    notes?: string;
  };
  onSave?: (data: LabResultFormData) => void;
  onCancel?: () => void;
}

export interface LabResultFormData {
  testName: string;
  resultDate: string;
  resultValue: string;
  referenceRange: string;
  interpretation: string;
  notes: string;
}

// Hardcoded lab tests for selection (will be replaced with backend later)
const hardcodedTests = [
  { value: 'cbc', label: 'Complete Blood Count (CBC)' },
  { value: 'lft', label: 'Liver Function Test (LFT)' },
  { value: 'rft', label: 'Renal Function Test (RFT)' },
  { value: 'blood-glucose', label: 'Blood Glucose' },
  { value: 'lipid-profile', label: 'Lipid Profile' },
  { value: 'urinalysis', label: 'Urinalysis' },
  { value: 'chest-xray', label: 'Chest X-Ray' },
  { value: 'ecg', label: 'ECG' },
  { value: 'hiv', label: 'HIV Test' },
  { value: 'malaria', label: 'Malaria Test' },
  { value: 'covid', label: 'COVID-19 Test' },
  { value: 'other', label: 'Other' },
];

// Hardcoded interpretation templates
const interpretationTemplates = {
  normal: 'Results are within normal reference range.',
  abnormal: 'Results are outside normal reference range. Clinical correlation recommended.',
  critical: 'Critical values detected. Immediate clinical attention recommended.',
  borderline: 'Results are at borderline levels. Repeat test recommended.',
};

export const LabResultForm: React.FC<LabResultFormProps> = ({ 
  theme = 'light', 
  initialData,
  onSave,
  onCancel 
}) => {
  const [formData, setFormData] = useState<LabResultFormData>({
    testName: initialData?.testName || '',
    resultDate: initialData?.resultDate || new Date().toISOString().split('T')[0],
    resultValue: initialData?.resultValue || '',
    referenceRange: initialData?.referenceRange || '',
    interpretation: initialData?.interpretation || '',
    notes: initialData?.notes || '',
  });

  const handleChange = useCallback((field: keyof LabResultFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTestChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, testName: value }));
    
    // Auto-fill reference range based on test type (hardcoded examples)
    const referenceRanges: Record<string, string> = {
      'cbc': 'WBC: 4.0-11.0 x10^9/L, RBC: 4.2-5.4 x10^12/L, HGB: 12.0-16.0 g/dL',
      'lft': 'ALT: 10-40 U/L, AST: 10-40 U/L, ALP: 30-120 U/L',
      'rft': 'Creatinine: 0.6-1.2 mg/dL, BUN: 7-20 mg/dL',
      'blood-glucose': 'Fasting: 70-99 mg/dL, Random: <140 mg/dL',
      'lipid-profile': 'Total: <200 mg/dL, LDL: <100 mg/dL, HDL: >40 mg/dL',
      'urinalysis': 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030',
    };
    
    if (referenceRanges[value]) {
      setFormData(prev => ({ ...prev, referenceRange: referenceRanges[value] }));
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.testName || !formData.resultValue) return;
    onSave?.(formData);
  }, [formData, onSave]);

  const isSaveDisabled = !formData.testName || !formData.resultValue;

  const isDark = theme === 'dark';

  const colors = {
    text: {
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
  };

  return (
    <BaseFormWrapper
      theme={theme}
      title="Lab Result"
      description="Enter and review laboratory test results"
      icon={<ClipboardList className="h-5 w-5" />}
      actions={
        <BaseFormActions
          theme={theme}
          onCancel={onCancel || (() => {})}
          onSave={handleSubmit}
          isSaveDisabled={isSaveDisabled}
          saveLabel="Save Result"
        />
      }
    >
      <div className="space-y-6">
        {/* Test Selection */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
            Test Name <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.testName}
            onChange={(e) => handleTestChange(e.target.value)}
            className={`w-full cursor-pointer rounded-lg border p-3 text-sm outline-none transition-all ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
            }`}
          >
            <option value="">Select a test...</option>
            {hardcodedTests.map(test => (
              <option key={test.value} value={test.value}>
                {test.label}
              </option>
            ))}
          </select>
        </div>

        {/* Result Date */}
        <BaseTextField
          theme={theme}
          label="Result Date"
          value={formData.resultDate}
          onChange={(value) => handleChange('resultDate', value)}
          type="text"
          placeholder="YYYY-MM-DD"
        />

        {/* Result Value */}
        <BaseTextField
          theme={theme}
          label="Result Value *"
          value={formData.resultValue}
          onChange={(value) => handleChange('resultValue', value)}
          placeholder="e.g., 12.5, Positive, Negative, 140/90"
        />

        {/* Reference Range */}
        <BaseTextField
          theme={theme}
          label="Reference Range"
          value={formData.referenceRange}
          onChange={(value) => handleChange('referenceRange', value)}
          placeholder="e.g., 10-20, Negative, <5.0"
          type="textarea"
          rows={2}
        />

        {/* Interpretation - Hardcoded options */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
            Interpretation
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {Object.entries(interpretationTemplates).map(([key, template]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleChange('interpretation', template)}
                className={`text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                  formData.interpretation === template
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          <textarea
            value={formData.interpretation}
            onChange={(e) => handleChange('interpretation', e.target.value)}
            placeholder="Clinical interpretation of the results..."
            rows={3}
            className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Additional Notes */}
        <BaseTextField
          theme={theme}
          label="Additional Notes"
          value={formData.notes}
          onChange={(value) => handleChange('notes', value)}
          placeholder="Any additional comments or observations..."
          type="textarea"
          rows={3}
        />

        {/* File Upload Placeholder (Hardcoded) */}
        <div className={`rounded-lg border-2 border-dashed p-6 text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Upload className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            File upload will be available soon
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Support for PDF, Images, and Documents
          </p>
        </div>

        {/* Validation Hint */}
        {(!formData.testName || !formData.resultValue) && (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
            <ClipboardList className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              Test name and result value are required before saving
            </p>
          </div>
        )}
      </div>
    </BaseFormWrapper>
  );
};

export default LabResultForm;
// LabRequestForm.tsx
import React, { useState, useCallback } from 'react';
import { Microscope, Plus, Trash2 } from 'lucide-react';
import { BaseFormWrapper } from './components/BaseFormWrapper';
import { BaseFormActions } from './components/BaseFormActions';
import { BaseTextField } from './components/BaseTextField';

interface LabRequestFormProps {
  theme?: 'light' | 'dark';
  initialData?: {
    tests?: LabTest[];
    notes?: string;
  };
  onSave?: (data: LabRequestFormData) => void;
  onCancel?: () => void;
}

export interface LabTest {
  id: string;
  testName: string;
  category: string;
  priority: 'normal' | 'urgent';
  notes: string;
}

export interface LabRequestFormData {
  tests: LabTest[];
  notes: string;
}

export const LabRequestForm: React.FC<LabRequestFormProps> = ({ 
  theme = 'light', 
  initialData,
  onSave,
  onCancel 
}) => {
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState<LabRequestFormData>({
    tests: initialData?.tests || [],
    notes: initialData?.notes || '',
  });

  const testCategories = [
    { value: 'hematology', label: 'Hematology' },
    { value: 'biochemistry', label: 'Biochemistry' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'urinalysis', label: 'Urinalysis' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'other', label: 'Other' },
  ];

  const priorityOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const addTest = useCallback(() => {
    const newTest: LabTest = {
      id: Date.now().toString(),
      testName: '',
      category: 'other',
      priority: 'normal',
      notes: '',
    };
    setFormData(prev => ({
      ...prev,
      tests: [...prev.tests, newTest]
    }));
  }, []);

  const updateTest = useCallback((id: string, field: keyof LabTest, value: string) => {
    setFormData(prev => ({
      ...prev,
      tests: prev.tests.map(test => 
        test.id === id ? { ...test, [field]: value } : test
      )
    }));
  }, []);

  const removeTest = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      tests: prev.tests.filter(test => test.id !== id)
    }));
  }, []);

  const handleChange = useCallback((field: keyof LabRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (formData.tests.length === 0) return;
    onSave?.(formData);
  }, [formData, onSave]);

  const isSaveDisabled = formData.tests.length === 0 || formData.tests.some(test => !test.testName.trim());

  const colors = {
    bg: {
      input: isDark ? 'bg-gray-800' : 'bg-gray-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
    },
  };

  return (
    <BaseFormWrapper
      theme={theme}
      title="Lab Request"
      description="Request laboratory tests and investigations"
      icon={<Microscope className="h-5 w-5" />}
      actions={
        <BaseFormActions
          theme={theme}
          onCancel={onCancel || (() => {})}
          onSave={handleSubmit}
          isSaveDisabled={isSaveDisabled}
        />
      }
    >
      <div className="space-y-6">
        {/* Tests Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className={`text-sm font-medium ${colors.text.primary}`}>
              Tests Requested <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addTest}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Test
            </button>
          </div>

          {formData.tests.length === 0 ? (
            <div className={`text-center py-8 rounded-lg border-2 border-dashed ${colors.border.primary}`}>
              <Microscope className={`h-8 w-8 mx-auto mb-2 ${colors.text.tertiary}`} />
              <p className={`text-sm ${colors.text.secondary}`}>
                No tests added yet. Click "Add Test" to start.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.tests.map((test, index) => (
                <div
                  key={test.id}
                  className={`rounded-lg border p-4 ${colors.border.primary} ${colors.bg.input}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${colors.text.primary}`}>
                      Test #{index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeTest(test.id)}
                      className="cursor-pointer rounded-lg p-1 text-red-500 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                        Test Name *
                      </label>
                      <input
                        type="text"
                        value={test.testName}
                        onChange={(e) => updateTest(test.id, 'testName', e.target.value)}
                        placeholder="e.g., Complete Blood Count, X-Ray Chest, Blood Glucose"
                        className={`w-full cursor-text rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} focus:border-blue-500`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                        Category
                      </label>
                      <select
                        value={test.category}
                        onChange={(e) => updateTest(test.id, 'category', e.target.value)}
                        className={`w-full cursor-pointer rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} focus:border-blue-500`}
                      >
                        {testCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                        Priority
                      </label>
                      <select
                        value={test.priority}
                        onChange={(e) => updateTest(test.id, 'priority', e.target.value as 'normal' | 'urgent')}
                        className={`w-full cursor-pointer rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} focus:border-blue-500`}
                      >
                        {priorityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                        Notes / Reason
                      </label>
                      <input
                        type="text"
                        value={test.notes}
                        onChange={(e) => updateTest(test.id, 'notes', e.target.value)}
                        placeholder="e.g., Patient presents with fever and fatigue"
                        className={`w-full cursor-text rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} focus:border-blue-500`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General Notes */}
        <BaseTextField
          theme={theme}
          label="Additional Instructions"
          value={formData.notes}
          onChange={(value) => handleChange('notes', value)}
          placeholder="Any additional instructions for the lab or notes about the request..."
          type="textarea"
          rows={3}
        />

        {/* Validation Hint */}
        {formData.tests.length === 0 && (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
            <Microscope className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              At least one test is required before saving
            </p>
          </div>
        )}
        
        {formData.tests.some(test => !test.testName.trim()) && formData.tests.length > 0 && (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              Please fill in all test names
            </span>
          </div>
        )}
      </div>
    </BaseFormWrapper>
  );
};

export default LabRequestForm;
// PrescriptionForm.tsx
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pill, Save, X, Plus, Trash2 } from 'lucide-react';

interface PrescriptionFormProps {
  theme?: 'light' | 'dark';
  initialData?: {
    medications?: Medication[];
    notes?: string;
  };
  onSave?: (data: PrescriptionFormData) => void;
  onCancel?: () => void;
}

export interface Medication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface PrescriptionFormData {
  medications: Medication[];
  notes: string;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ 
  theme = 'light', 
  initialData,
  onSave,
  onCancel 
}) => {
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState<PrescriptionFormData>({
    medications: initialData?.medications || [],
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

  const addMedication = useCallback(() => {
    const newMedication: Medication = {
      id: Date.now().toString(),
      drugName: '',
      dosage: '',
      frequency: '',
      duration: '',
      route: 'oral',
      instructions: '',
    };
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
  }, []);

  const updateMedication = useCallback((id: string, field: keyof Medication, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map(med => 
        med.id === id ? { ...med, [field]: value } : med
      )
    }));
  }, []);

  const removeMedication = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== id)
    }));
  }, []);

  const handleChange = useCallback((field: keyof PrescriptionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (formData.medications.length === 0) {
      return;
    }
    onSave?.(formData);
  }, [formData, onSave]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const routes = [
    { value: 'oral', label: 'Oral' },
    { value: 'topical', label: 'Topical' },
    { value: 'intravenous', label: 'Intravenous' },
    { value: 'intramuscular', label: 'Intramuscular' },
    { value: 'subcutaneous', label: 'Subcutaneous' },
    { value: 'inhalation', label: 'Inhalation' },
    { value: 'rectal', label: 'Rectal' },
  ];

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
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
              Prescription
            </h2>
            <p className={`text-sm ${colors.text.secondary}`}>
              Prescribe medications with dosage and frequency
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medications Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className={`text-sm font-medium ${colors.text.primary}`}>
                Medications <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addMedication}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Medication
              </button>
            </div>

            {formData.medications.length === 0 ? (
              <div className={`text-center py-8 rounded-lg border-2 border-dashed ${colors.border.primary}`}>
                <Pill className={`h-8 w-8 mx-auto mb-2 ${colors.text.tertiary}`} />
                <p className={`text-sm ${colors.text.secondary}`}>
                  No medications added yet. Click "Add Medication" to start.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.medications.map((medication, index) => (
                  <div
                    key={medication.id}
                    className={`rounded-lg border p-4 ${colors.border.primary} ${colors.bg.input}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-semibold ${colors.text.primary}`}>
                        Medication #{index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeMedication(medication.id)}
                        className="cursor-pointer rounded-lg p-1 text-red-500 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                          Drug Name *
                        </label>
                        <input
                          type="text"
                          value={medication.drugName}
                          onChange={(e) => updateMedication(medication.id, 'drugName', e.target.value)}
                          placeholder="e.g., Amoxicillin, Paracetamol"
                          className={`w-full cursor-text rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                          Dosage *
                        </label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg, 10ml"
                          className={`w-full cursor-text rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                          Frequency *
                        </label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => updateMedication(medication.id, 'frequency', e.target.value)}
                          placeholder="e.g., Twice daily, Every 8 hours"
                          className={`w-full cursor-text rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                          Duration *
                        </label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => updateMedication(medication.id, 'duration', e.target.value)}
                          placeholder="e.g., 7 days, 2 weeks"
                          className={`w-full cursor-text rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                          Route
                        </label>
                        <select
                          value={medication.route}
                          onChange={(e) => updateMedication(medication.id, 'route', e.target.value)}
                          className={`w-full cursor-pointer rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                        >
                          {routes.map(route => (
                            <option key={route.value} value={route.value}>
                              {route.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={`block text-xs font-medium mb-1 ${colors.text.secondary}`}>
                          Instructions
                        </label>
                        <input
                          type="text"
                          value={medication.instructions}
                          onChange={(e) => updateMedication(medication.id, 'instructions', e.target.value)}
                          placeholder="e.g., Take with food, Before meals"
                          className={`w-full cursor-text rounded-lg border p-2 text-sm outline-none transition-all ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescription Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.primary}`}>
              Prescription Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional instructions, warnings, or notes for the patient..."
              rows={3}
              className={`w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} ${colors.border.focus}`}
            />
          </div>

          {/* Validation Hint */}
          {formData.medications.length === 0 && (
            <div className={`flex items-center gap-2 rounded-lg p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
              <Pill className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                At least one medication is required before saving
              </p>
            </div>
          )}

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
              disabled={formData.medications.length === 0}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                formData.medications.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed text-gray-200'
              }`}
            >
              <Save className="h-4 w-4" />
              Save Prescription
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default PrescriptionForm;
import React, { useState } from 'react';

import AlertCard from '../components/Cards/AlertCard';
import AllergyTag from '../components/Badges/AllergyTag';
import Button from '../components/Buttons/Button';
import FormActions from '../components/FormActions';
import FormSection from '../components/Forms/FormSection';
import FormField from '../components/Forms/FormField';
import Textarea from '../components/Inputs/Textarea';
import Select from '../components/Inputs/Select';
import DateInput from '../components/Inputs/DateInput';
import NumberInput from '../components/Inputs/NumberInput';
import TextInput from '../components/Inputs/TextInput';
import Card from '../components/Cards/Card';
import { FaSave, FaTimes } from 'react-icons/fa';

/**
 * FORM EXAMPLE: Patient Medical Record
 * 
 * Demonstrates all form components with validation
 */

const FormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    weight: '',
    temperature: '',
    bloodPressure: '',
    diagnosis: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: Record<string, string> = {};
    if (!formData.patientName) newErrors.patientName = 'Patient name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('Form submitted:', formData);
    alert('Patient record saved successfully!');
  };

  return (
    <div className="min-h-screen bg-neutral-gray-bg p-32">
      <div className="max-w-4xl mx-auto">
        <Card padding="large">
          <h1 className="text-h2 text-neutral-black mb-32">
            Patient Medical Record
          </h1>

          {/* Critical Allergy Warning */}
          <AlertCard variant="error" title="CRITICAL ALLERGY ALERT" className="mb-32">
            <div className="space-y-8">
              <AllergyTag allergen="Penicillin" severity="severe" />
              <AllergyTag allergen="Sulfa Drugs" severity="moderate" />
              <p className="text-body mt-8">
                Do not prescribe: Amoxicillin, Ampicillin, Trimethoprim
              </p>
            </div>
          </AlertCard>

          <form onSubmit={handleSubmit}>
            {/* Patient Information */}
            <FormSection
              title="Patient Information"
              description="Enter basic patient details"
            >
              <FormField>
                <TextInput
                  label="Patient Name"
                  placeholder="Enter full name"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  error={errors.patientName}
                  required
                  fullWidth
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <FormField>
                  <NumberInput
                    label="Age"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    error={errors.age}
                    min={0}
                    max={150}
                    unit="years"
                    showControls
                    required
                  />
                </FormField>

                <FormField>
                  <DateInput
                    label="Date of Visit"
                    type="date"
                    required
                  />
                </FormField>
              </div>

              <FormField>
                <Select
                  label="Blood Type"
                  options={[
                    { value: 'A+', label: 'A Positive' },
                    { value: 'A-', label: 'A Negative' },
                    { value: 'B+', label: 'B Positive' },
                    { value: 'B-', label: 'B Negative' },
                    { value: 'O+', label: 'O Positive' },
                    { value: 'O-', label: 'O Negative' },
                    { value: 'AB+', label: 'AB Positive' },
                    { value: 'AB-', label: 'AB Negative' },
                  ]}
                  placeholder="Select blood type"
                  helpText="Select patient's blood type for transfusion compatibility"
                />
              </FormField>
            </FormSection>

            {/* Vital Signs */}
            <FormSection
              title="Vital Signs"
              description="Record current vital signs"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <FormField>
                  <NumberInput
                    label="Temperature"
                    placeholder="36.5"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    step={0.1}
                    min={35}
                    max={42}
                    unit="°C"
                    showControls
                  />
                </FormField>

                <FormField>
                  <NumberInput
                    label="Heart Rate"
                    placeholder="75"
                    min={40}
                    max={200}
                    unit="bpm"
                    showControls
                  />
                </FormField>

                <FormField>
                  <NumberInput
                    label="Weight"
                    placeholder="70"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    min={0}
                    max={300}
                    unit="kg"
                    showControls
                  />
                </FormField>
              </div>

              <FormField>
                <TextInput
                  label="Blood Pressure"
                  placeholder="120/80"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                  helpText="Format: Systolic/Diastolic (e.g., 120/80)"
                />
              </FormField>
            </FormSection>

            {/* Clinical Notes */}
            <FormSection
              title="Clinical Assessment"
              description="Document diagnosis and observations"
            >
              <FormField>
                <TextInput
                  label="Preliminary Diagnosis"
                  placeholder="Enter diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </FormField>

              <FormField>
                <Textarea
                  label="Clinical Notes"
                  placeholder="Enter detailed clinical observations, symptoms, and examination findings..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  autoResize
                  minRows={5}
                  maxRows={15}
                  helpText="Document all relevant clinical information"
                />
              </FormField>
            </FormSection>

            {/* AI Suggestion */}
            <AlertCard variant="info" title="AI Diagnostic Suggestion" className="mb-32">
              <p className="text-body">
                Based on symptoms (fever + endemic region), consider <strong>Malaria</strong> (78% probability).
                Recommend rapid diagnostic test (RDT) for confirmation.
              </p>
              <div className="mt-12 flex gap-8">
                <Button variant="ghost" size="small">
                  Order RDT Test
                </Button>
                <Button variant="ghost" size="small">
                  View Similar Cases
                </Button>
                <Button variant="ghost" size="small">
                  Dismiss
                </Button>
              </div>
            </AlertCard>

            {/* Form Actions */}
            <FormActions align="right">
              <Button
                type="button"
                variant="secondary"
                icon={FaTimes}
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={FaSave}
                iconPosition="left"
              >
                Save Patient Record
              </Button>
            </FormActions>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default FormExample;
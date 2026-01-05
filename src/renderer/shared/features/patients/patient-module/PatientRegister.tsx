import React from 'react';
import { User, Phone, AlertCircle, Heart, UserPlus } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import type { RegistrationForm } from './types';

/**
 * ============================================================================
 * PATIENT REGISTRATION COMPONENT
 * ============================================================================
 * 
 * Multi-section registration form for new patients.
 * 
 * Features:
 * - Personal information section
 * - Contact information section
 * - Emergency contact section
 * - Medical information section
 * - Form validation
 * - Theme-aware styling
 * - Accessible form controls
 */

interface PatientRegisterProps {
  theme: 'light' | 'dark';
  formData: RegistrationForm;
  onChange: (field: keyof RegistrationForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const PatientRegister: React.FC<PatientRegisterProps> = ({
  theme,
  formData,
  onChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Register New Patient
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Enter patient information to create a new record
        </p>
      </div>

      {/* Registration form */}
      <form onSubmit={onSubmit}>
        <div className={cn(
          'rounded-2xl border p-6',
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
            : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
        )}>
          {/* Personal Information Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => onChange('firstName', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => onChange('lastName', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => onChange('dateOfBirth', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => onChange('gender', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <Phone className="w-5 h-5" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  required
                  placeholder="+1 (555) 123-4567"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  required
                  placeholder="patient@email.com"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => onChange('address', e.target.value)}
                  required
                  placeholder="123 Main St, City, State, ZIP"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <AlertCircle className="w-5 h-5" />
              Emergency Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => onChange('emergencyContact', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => onChange('emergencyPhone', e.target.value)}
                  required
                  placeholder="+1 (555) 123-4567"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <Heart className="w-5 h-5" />
              Medical Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Blood Type
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => onChange('bloodType', e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={formData.insurance}
                  onChange={(e) => onChange('insurance', e.target.value)}
                  placeholder="e.g., Blue Cross, Aetna"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Known Allergies
                </label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => onChange('allergies', e.target.value)}
                  rows={2}
                  placeholder="List any known allergies..."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Current Medications
                </label>
                <textarea
                  value={formData.medications}
                  onChange={(e) => onChange('medications', e.target.value)}
                  rows={2}
                  placeholder="List current medications..."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 focus:ring-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400'
              )}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'flex items-center gap-2',
                theme === 'dark'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 focus:ring-cyan-500'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 focus:ring-blue-500'
              )}
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

PatientRegister.displayName = 'PatientRegister';
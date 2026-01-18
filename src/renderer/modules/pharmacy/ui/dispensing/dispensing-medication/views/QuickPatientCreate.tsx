// views/QuickPatientCreate.tsx
import React, { useState } from 'react';
import { Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

interface QuickPatientCreateProps {
  theme: 'light' | 'dark';
}

const QuickPatientCreate: React.FC<QuickPatientCreateProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [patientCreated, setPatientCreated] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<{
    patientId: string;
    patientNumber: string;
    name: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    setTimeout(() => {
      const newPatient = {
        patientId: `PAT-${Date.now()}`,
        patientNumber: `PN${Math.floor(Math.random() * 100000)}`,
        name: formData.name,
      };

      setCreatedPatient(newPatient);
      setPatientCreated(true);
      setIsCreating(false);
    }, 1500);
  };

  const handleProceedToDispense = () => {
    if (createdPatient) {
      navigate(
        `${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${createdPatient.patientId}`
      );
    }
  };

  const isFormValid =
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.phone.trim() !== '';

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isDark ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}
          >
            <Zap className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Quick Patient Create</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Fast registration for new patients
          </p>
        </div>

        {!patientCreated ? (
          <form
            onSubmit={handleSubmit}
            className={`rounded-xl border p-6 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className="space-y-4 mb-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-900 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="john@email.com"
                    required
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-900 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-900 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-900 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isCreating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Patient...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Create Patient
                </>
              )}
            </button>
          </form>
        ) : (
          <div
            className={`rounded-xl border p-8 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Patient Created Successfully!</h3>
            </div>

            <div className="space-y-3 mb-6">
              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Patient ID
                </div>
                <div className="font-mono font-semibold">{createdPatient?.patientId}</div>
              </div>

              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Patient Number
                </div>
                <div className="font-mono font-semibold">{createdPatient?.patientNumber}</div>
              </div>

              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Name</div>
                <div className="font-semibold">{createdPatient?.name}</div>
              </div>
            </div>

            <button
              onClick={handleProceedToDispense}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Proceed to Dispense Medication
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickPatientCreate;

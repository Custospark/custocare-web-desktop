// views/PatientSearch.tsx
import React, { useState } from 'react';
import { Search, User, Phone, Mail, ArrowRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

interface PatientSearchProps {
  theme: 'light' | 'dark';
}

interface Patient {
  patientId: string;
  patientNumber: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Patient | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock patient data
  const mockPatients: Patient[] = [
    {
      patientId: 'PAT-001',
      patientNumber: 'PN12345',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1234567890',
      age: 35,
      gender: 'Male',
    },
    {
      patientId: 'PAT-002',
      patientNumber: 'PN67890',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+0987654321',
      age: 28,
      gender: 'Female',
    },
  ];

  const handleSearch = () => {
    setIsSearching(true);
    setNotFound(false);
    setSearchResult(null);

    setTimeout(() => {
      const found = mockPatients.find(
        (p) => p.patientNumber.toLowerCase() === searchTerm.toLowerCase()
      );

      if (found) {
        setSearchResult(found);
      } else {
        setNotFound(true);
      }
      setIsSearching(false);
    }, 1000);
  };

  const handleProceedToDispense = () => {
    if (searchResult) {
      navigate(
        `${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${searchResult.patientId}`
      );
    }
  };

  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleCreatePatient = () => {
    // Simulate patient creation
    const newPatient: Patient = {
      patientId: `PAT-${Date.now()}`,
      patientNumber: `PN${Math.floor(Math.random() * 100000)}`,
      name: newPatientForm.name,
      email: newPatientForm.email,
      phone: newPatientForm.phone,
      age: 0,
      gender: 'Not specified',
    };

    setSearchResult(newPatient);
    setShowCreateForm(false);
    setNotFound(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Search Patient</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Search by patient number to begin dispensing
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter patient number (e.g., PN12345)"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchTerm || isSearching}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div
            className={`rounded-xl border p-6 mb-4 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}
                >
                  <User className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{searchResult.name}</h3>
                  <div
                    className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} space-y-1`}
                  >
                    <div>Patient #: {searchResult.patientNumber}</div>
                    <div>ID: {searchResult.patientId}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center gap-3`}
              >
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Email
                  </div>
                  <div className="font-medium">{searchResult.email}</div>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center gap-3`}
              >
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Phone
                  </div>
                  <div className="font-medium">{searchResult.phone}</div>
                </div>
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

        {/* Not Found */}
        {notFound && !showCreateForm && (
          <div
            className={`rounded-xl border p-8 text-center ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isDark ? 'bg-red-900/30' : 'bg-red-100'
              }`}
            >
              <Search className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Patient Not Found</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No patient found with number: <strong>{searchTerm}</strong>
            </p>

            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Create New Patient
            </button>
          </div>
        )}

        {/* Create New Patient Form */}
        {showCreateForm && (
          <div
            className={`rounded-xl border p-6 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Create New Patient</h3>

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
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter patient name"
                />
              </div>

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
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="patient@email.com"
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
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNotFound(false);
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePatient}
                disabled={!newPatientForm.name || !newPatientForm.email || !newPatientForm.phone}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Patient
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSearch;

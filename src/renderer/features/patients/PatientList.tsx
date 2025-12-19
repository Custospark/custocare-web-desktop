import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useGetPatients } from '../../api/queries/patientQueries';
import { getPatientDetailRoute } from '../../routes/routeConstants'
import LoadingScreen from '../../components/Loading/LoadingScreen';
import Button from '../../components/Common/Button';

function PatientList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data: patientsData, isLoading } = useGetPatients();

  const filteredPatients = patientsData?.data.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all patient records
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/patients/new')}>
          <Plus className="w-5 h-5" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Patient Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients?.map((patient) => (
              <tr key={patient.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{patient.name}</td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{patient.email}</td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{patient.phone}</td>
                <td className="px-6 py-3 text-sm">
                  <button
                    onClick={() => navigate(getPatientDetailRoute(patient.id))}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PatientList;
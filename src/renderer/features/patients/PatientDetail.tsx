import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetPatientById } from '../../api/queries/patientQueries'
import LoadingScreen from '../../components/Loading/LoadingScreen';
import Button from '../../components/Common/Button';

function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading } = useGetPatientById(id || '');

  if (isLoading) return <LoadingScreen />;

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Patient not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {patient.name}
            </h1>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="text-lg text-gray-900 dark:text-white">{patient.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="text-lg text-gray-900 dark:text-white">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                <p className="text-lg text-gray-900 dark:text-white">{patient.dateOfBirth}</p>
              </div>
            </div>
          </div>

          <div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Address</p>
              <p className="text-lg text-gray-900 dark:text-white">{patient.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDetail
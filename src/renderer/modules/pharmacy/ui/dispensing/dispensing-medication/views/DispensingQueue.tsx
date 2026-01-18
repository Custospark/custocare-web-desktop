// views/DispensingQueue.tsx
import React, { useState } from 'react';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

interface DispensingQueueProps {
  theme: 'light' | 'dark';
}

interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  queueNumber: number;
  prescriptionCount: number;
  status: 'pending' | 'in-progress' | 'ready';
  waitTime: string;
}

const DispensingQueue: React.FC<DispensingQueueProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Mock queue data
  const [queueItems] = useState<QueueItem[]>([
    {
      id: 'Q001',
      patientId: 'PAT-001',
      patientName: 'John Doe',
      patientNumber: 'PN12345',
      queueNumber: 1,
      prescriptionCount: 3,
      status: 'in-progress',
      waitTime: '5 mins',
    },
    {
      id: 'Q002',
      patientId: 'PAT-002',
      patientName: 'Jane Smith',
      patientNumber: 'PN67890',
      queueNumber: 2,
      prescriptionCount: 2,
      status: 'pending',
      waitTime: '12 mins',
    },
    {
      id: 'Q003',
      patientId: 'PAT-003',
      patientName: 'Bob Johnson',
      patientNumber: 'PN11111',
      queueNumber: 3,
      prescriptionCount: 1,
      status: 'pending',
      waitTime: '18 mins',
    },
    {
      id: 'Q004',
      patientId: 'PAT-004',
      patientName: 'Alice Williams',
      patientNumber: 'PN22222',
      queueNumber: 4,
      prescriptionCount: 4,
      status: 'ready',
      waitTime: 'Ready',
    },
  ]);

  const handleProcessQueue = (item: QueueItem) => {
    navigate(
      `${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${item.patientId}&queueId=${item.id}`
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'ready':
        return isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800';
      default:
        return isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'ready':
        return 'Ready';
      default:
        return status;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dispensing Queue</h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Pending prescriptions waiting to be dispensed
              </p>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isDark ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {queueItems.length} in Queue
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {queueItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Queue Number */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      isDark ? 'bg-gray-900 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {item.queueNumber}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{item.patientName}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div
                      className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      } flex items-center gap-4`}
                    >
                      <span>Patient #: {item.patientNumber}</span>
                      <span>•</span>
                      <span>{item.prescriptionCount} prescriptions</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.waitTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleProcessQueue(item)}
                    className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Process
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {queueItems.length === 0 && (
          <div
            className={`rounded-xl border p-12 text-center ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              No pending prescriptions at the moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispensingQueue;

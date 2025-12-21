// features/department/DepartmentQueuesModule.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/index';
import { ContentLayout } from '../../components/content/ContentLayout';
import { Microscope, Pill, FileText, Users, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

const DepartmentQueuesModule: React.FC<{ department?: string }> = ({ department = 'laboratory' }) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { departmentQueues } = useSelector((state: RootState) => state.clinicalEncounter);
  
  const departmentConfig = {
    laboratory: {
      name: 'Laboratory',
      icon: <Microscope className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500',
    },
    pharmacy: {
      name: 'Pharmacy',
      icon: <Pill className="w-5 h-5" />,
      color: 'from-emerald-500 to-green-500',
    },
    radiology: {
      name: 'Radiology',
      icon: <FileText className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
    },
    billing: {
      name: 'Billing',
      icon: <Users className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-500',
    },
  };

  const queue = departmentQueues[department] || [];
  const config = departmentConfig[department as keyof typeof departmentConfig] || departmentConfig.laboratory;

  return (
    <ContentLayout
      operations={Object.entries(departmentConfig).map(([id, config]) => ({
        id,
        label: config.name,
        icon: config.icon,
      }))}
      activeOperation={department}
      onOperationChange={() => {}}
      headerTitle={`${config.name} Queue`}
    >
      <div className="p-6 space-y-6">
        {/* Queue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn(
            'p-5 rounded-xl border',
            theme === 'dark'
              ? 'bg-gray-800/30 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-200">Total in Queue</h4>
              <div className={cn(
                'p-2 rounded-lg',
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{queue.length}</p>
          </div>
          
          <div className={cn(
            'p-5 rounded-xl border',
            theme === 'dark'
              ? 'bg-gray-800/30 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-200">Completed Today</h4>
              <div className={cn(
                'p-2 rounded-lg',
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-400">24</p>
          </div>
          
          <div className={cn(
            'p-5 rounded-xl border',
            theme === 'dark'
              ? 'bg-gray-800/30 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-200">Average Wait Time</h4>
              <div className={cn(
                'p-2 rounded-lg',
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <span className="text-gray-400 text-sm">min</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-400">15</p>
          </div>
        </div>

        {/* Queue List */}
        <div className={cn(
          'rounded-xl border',
          theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-gray-200">Current Queue</h3>
          </div>
          
          <div className="divide-y divide-gray-700">
            {queue.length > 0 ? (
              queue.map((patient, index) => (
                <div key={patient.encounterId} className="p-4 hover:bg-gray-800/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold',
                        theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200">{patient.patientName}</h4>
                        <p className="text-sm text-gray-400">{patient.task}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded',
                        patient.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      )}>
                        {patient.priority}
                      </span>
                      <button className="px-3 py-1 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700">
                        Process
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                )}>
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-300 mb-2">Queue is empty</h4>
                <p className="text-gray-400">No patients currently waiting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ContentLayout>
  );
};

export default DepartmentQueuesModule;
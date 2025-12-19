import React from 'react';
import { useGetDashboardStats, useGetDashboardAnalytics } from '../../api/queries/dashboardQeries'
import { Users, TrendingUp, Calendar, FileText } from 'lucide-react';
import DashboardCard from './DashboardCard';
import LoadingScreen from '../../components/Loading/LoadingScreen';

function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: analytics, isLoading: analyticsLoading } = useGetDashboardAnalytics();

  if (statsLoading || analyticsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your healthcare overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          icon={Users}
          title="Total Patients"
          value={stats?.totalPatients || 0}
          color="blue"
        />
        <DashboardCard
          icon={TrendingUp}
          title="Active Patients"
          value={stats?.activePatients || 0}
          color="cyan"
        />
        <DashboardCard
          icon={Calendar}
          title="Appointments Today"
          value={stats?.appointmentsToday || 0}
          color="green"
        />
        <DashboardCard
          icon={FileText}
          title="Pending Reports"
          value={stats?.pendingReports || 0}
          color="orange"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {analytics?.patientGrowth.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label || item.date}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appointment Status
          </h2>
          <div className="space-y-3">
            {analytics?.appointmentStatus.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.status}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
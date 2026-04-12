import React, { useMemo } from 'react';
import {
  Bed,
  Building2,
  CheckCircle2,
  ChevronUp,
  Users,
} from 'lucide-react';
import type { Department } from '../../../../../administration/admin-module/api/department-managment/departmentTypes';
import {
  DepartmentStatus,
  DepartmentType,
} from '../../../../../administration/admin-module/api/department-managment/departmentTypes';

interface DepartmentStatsOverviewProps {
  theme: 'light' | 'dark';
  departments: Department[];
}

export const DepartmentStatsOverview: React.FC<DepartmentStatsOverviewProps> = ({
  theme,
  departments,
}) => {
  const isDark = theme === 'dark';

  const stats = useMemo(() => {
    const totalDepartments = departments.length;
    const activeDepartments = departments.filter(
      (d) => d.status === DepartmentStatus.ACTIVE
    ).length;
    const totalBeds = departments.reduce((sum, d) => sum + (d.bed_count || 0), 0);
    const avgBeds = totalDepartments > 0 ? Math.round(totalBeds / totalDepartments) : 0;
    const topBeds =
      totalDepartments > 0 ? Math.max(...departments.map((d) => d.bed_count || 0)) : 0;
    const outpatientCount = departments.filter(
      (d) => d.department_type === DepartmentType.OUTPATIENT
    ).length;
    const supportServicesCount = departments.filter(
      (d) => d.department_type === DepartmentType.SUPPORT_SERVICES
    ).length;
    const activationRate =
      totalDepartments > 0 ? Math.round((activeDepartments / totalDepartments) * 100) : 0;

    return {
      totalDepartments,
      activeDepartments,
      totalBeds,
      avgBeds,
      topBeds,
      outpatientCount,
      supportServicesCount,
      activationRate,
    };
  }, [departments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1 ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20'
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100 ${
            isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
          }`}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Departments
            </p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalDepartments}
            </p>

            <div className="flex items-center gap-1 mt-2">
              <ChevronUp className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                +{stats.totalDepartments > 0 ? Math.floor(stats.totalDepartments * 0.15) : 0}% this month
              </span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110'
                : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
            }`}
          >
            <Building2 className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isDark
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}
          >
            Out Patient: {stats.outpatientCount}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isDark
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-purple-100 text-purple-700 border border-purple-300'
            }`}
          >
            Support Services: {stats.supportServicesCount}
          </span>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1 ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20'
            : 'bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100 ${
            isDark ? 'bg-green-500/10' : 'bg-green-500/5'
          }`}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Active Departments
            </p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.activeDepartments}
            </p>

            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  isDark
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-green-100 text-green-700 border border-green-300'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Operational
              </span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark
                ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110'
                : 'bg-green-100 group-hover:bg-green-200 group-hover:scale-110'
            }`}
          >
            <Users className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Activation Rate</span>
            <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {stats.activationRate}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.activationRate}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1 ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20'
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100 ${
            isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'
          }`}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Beds
            </p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalBeds}
            </p>

            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Avg. {stats.avgBeds} beds/dept
            </p>
          </div>

          <div
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark
                ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110'
                : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
            }`}
          >
            <Bed className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Max Capacity</span>
              <span className={`font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {stats.totalBeds} beds
              </span>
            </div>
            <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
              <div className="h-full w-full bg-purple-500 rounded-full" />
            </div>
          </div>

          {stats.totalDepartments > 0 && (
            <div
              className={`text-xs px-2 py-1 rounded-full ${
                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              }`}
            >
              Top: {stats.topBeds} beds
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentStatsOverview;

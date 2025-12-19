import React, { useMemo } from 'react';
import Breadcrumb from '../components/Navigation/Breadcrumbs';
import ContentSection from '../components/Navigation/ContentSection';
import {
   Plus, FileText, 
  Sparkles, Users,
 Clock, Calendar, Download,
  Filter, Search, Bell, MessageSquare, Video, 
  Heart, Brain, Eye, 
} from 'lucide-react';
import { cn } from '../types/cn';
import { useAppContext } from '../store/state/AppContext'

/**
 * Premium Dashboard Component
 */
export const Dashboard: React.FC = () => {
  const { state, setSearchQuery } = useAppContext();
  const { theme } = state;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Healthcare Analytics', href: '/dashboard/analytics' },
    { label: 'Live Overview' },
  ];

  const statsCards = useMemo(() => [
    {
      title: 'Active Patients',
      value: '2,427',
      change: '+12.5%',
      trend: 'up',
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      detail: '24 in critical condition'
    },
    {
      title: 'Avg. Wait Time',
      value: '8.4m',
      change: '-2.3m',
      trend: 'down',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-emerald-500 to-green-500',
      detail: 'Below target of 15m'
    },
    {
      title: 'Satisfaction',
      value: '94.2%',
      change: '+3.1%',
      trend: 'up',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500',
      detail: '487 reviews this month'
    },
    {
      title: 'AI Accuracy',
      value: '98.7%',
      change: '+0.4%',
      trend: 'up',
      icon: <Brain className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-500',
      detail: 'Based on 12.4K diagnoses'
    }
  ], []);

  const recentPatients = useMemo(() => [
    {
      id: 'PT-2023-8492',
      name: 'John Doe',
      age: '42',
      gender: 'M',
      status: 'critical',
      lastVisit: '2 hours ago',
      doctor: 'Dr. Smith',
      condition: 'Hypertension'
    },
    {
      id: 'PT-2023-8493',
      name: 'Jane Smith',
      age: '34',
      gender: 'F',
      status: 'stable',
      lastVisit: '1 day ago',
      doctor: 'Dr. Johnson',
      condition: 'Diabetes Type 2'
    },
    {
      id: 'PT-2023-8494',
      name: 'Robert Chen',
      age: '58',
      gender: 'M',
      status: 'monitoring',
      lastVisit: '3 hours ago',
      doctor: 'Dr. Williams',
      condition: 'Cardiac Arrhythmia'
    },
    {
      id: 'PT-2023-8495',
      name: 'Maria Garcia',
      age: '29',
      gender: 'F',
      status: 'stable',
      lastVisit: '2 days ago',
      doctor: 'Dr. Brown',
      condition: 'Asthma'
    }
  ], []);

  const quickActions = useMemo(() => [
    { icon: <Plus className="w-5 h-5" />, label: 'New Patient', color: 'bg-blue-500' },
    { icon: <FileText className="w-5 h-5" />, label: 'Quick Report', color: 'bg-emerald-500' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Schedule', color: 'bg-purple-500' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Messages', color: 'bg-amber-500' },
    { icon: <Video className="w-5 h-5" />, label: 'Telehealth', color: 'bg-rose-500' },
    { icon: <Bell className="w-5 h-5" />, label: 'Alerts', color: 'bg-red-500' },
  ], []);

  const renderStatsGrid = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => (
        <div
          key={index}
          className={cn(
            'relative p-5 rounded-2xl border backdrop-blur-sm',
            'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50 hover:border-gray-700/50'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60 hover:border-gray-300'
          )}
        >
          {/* Background gradient */}
          <div className={cn(
            'absolute inset-0 rounded-2xl opacity-10',
            `bg-gradient-to-br ${stat.color}`
          )} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                'p-2.5 rounded-xl',
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
              )}>
                <div className={cn(
                  'text-white',
                  stat.color.includes('blue') ? 'text-blue-400' :
                  stat.color.includes('emerald') ? 'text-emerald-400' :
                  stat.color.includes('purple') ? 'text-purple-400' : 'text-amber-400'
                )}>
                  {stat.icon}
                </div>
              </div>
              <span className={cn(
                'px-2.5 py-1 text-xs font-bold rounded-full',
                stat.trend === 'up'
                  ? theme === 'dark'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700'
                  : theme === 'dark'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-red-100 text-red-700'
              )}>
                {stat.change}
              </span>
            </div>

            <div className="space-y-1">
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {stat.title}
              </p>
              <h3 className={cn(
                'text-2xl lg:text-3xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {stat.value}
              </h3>
              <p className={cn(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              )}>
                {stat.detail}
              </p>
            </div>

            {/* Trend line */}
            <div className="mt-4">
              <div className={cn(
                'h-1 rounded-full overflow-hidden',
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              )}>
                <div
                  className={cn(
                    'h-full rounded-full',
                    stat.trend === 'up'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                  )}
                  style={{ width: stat.trend === 'up' ? '85%' : '65%' }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ), [statsCards, theme]);

  const renderPatientTable = useMemo(() => (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
    )}>
      <div className={cn(
        'px-4 py-3 border-b',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800/50' : 'bg-gray-50/50 border-gray-200'
      )}>
        <div className="flex items-center justify-between">
          <h4 className={cn(
            'text-sm font-semibold',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Recent Patients
          </h4>
          <button className={cn(
            'text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}>
            <Filter className="w-3 h-3" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn(
              'border-b text-xs font-semibold',
              theme === 'dark' ? 'border-gray-800/50 text-gray-400' : 'border-gray-200 text-gray-600'
            )}>
              <th className="py-3 px-4 text-left">Patient</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Condition</th>
              <th className="py-3 px-4 text-left">Last Visit</th>
              <th className="py-3 px-4 text-left">Doctor</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentPatients.map((patient) => (
              <tr
                key={patient.id}
                className={cn(
                  'border-b transition-colors hover:bg-opacity-50',
                  theme === 'dark'
                    ? 'border-gray-800/30 hover:bg-gray-800/30'
                    : 'border-gray-100 hover:bg-gray-50/50'
                )}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    )}>
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {patient.name}
                      </p>
                      <p className={cn(
                        'text-xs',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        {patient.id} • {patient.age}yo {patient.gender}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={cn(
                    'px-2.5 py-1 text-xs font-bold rounded-full',
                    patient.status === 'critical'
                      ? theme === 'dark'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-red-100 text-red-700'
                      : patient.status === 'monitoring'
                      ? theme === 'dark'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-amber-100 text-amber-700'
                      : theme === 'dark'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700'
                  )}>
                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {patient.condition}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {patient.lastVisit}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <p className={cn(
                    'text-sm font-medium',
                    theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
                  )}>
                    {patient.doctor}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}>
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}>
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ), [recentPatients, theme]);

  const renderQuickActions = useMemo(() => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {quickActions.map((action, index) => (
        <button
          key={index}
          className={cn(
            'flex flex-col items-center justify-center p-4 rounded-2xl border',
            'transition-all duration-300 hover:scale-105 hover:shadow-lg',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50 hover:border-gray-700/50'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60 hover:border-gray-300'
          )}
        >
          <div className={cn(
            'w-12 h-12 rounded-xl mb-3',
            'flex items-center justify-center',
            action.color
          )}>
            <div className="text-white">
              {action.icon}
            </div>
          </div>
          <span className={cn(
            'text-xs font-medium text-center',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            {action.label}
          </span>
        </button>
      ))}
    </div>
  ), [quickActions, theme]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={breadcrumbItems}
        theme={theme}
        onItemClick={(item, index) => console.log('Breadcrumb clicked:', item, index)}
        maxItems={3}
      />

      {/* Main Content Section */}
      <ContentSection
        title="Healthcare Dashboard"
        subtitle="Live Overview"
        description="Real-time analytics and insights for your healthcare practice. Monitor patient flow, satisfaction scores, and AI-powered diagnostics."
        theme={theme}
        showViewToggle={true}
        showFilters={true}
        viewMode="list"
        onViewModeChange={(mode) => console.log('View mode:', mode)}
        filters={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={cn(
                'block text-xs font-medium mb-2',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Time Range
              </label>
              <select className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                'border transition-colors',
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 text-gray-300'
                  : 'bg-white border-gray-300 text-gray-700'
              )}>
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last quarter</option>
              </select>
            </div>
            <div>
              <label className={cn(
                'block text-xs font-medium mb-2',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Department
              </label>
              <select className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                'border transition-colors',
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 text-gray-300'
                  : 'bg-white border-gray-300 text-gray-700'
              )}>
                <option>All Departments</option>
                <option>Emergency</option>
                <option>Cardiology</option>
                <option>Neurology</option>
                <option>Pediatrics</option>
              </select>
            </div>
            <div>
              <label className={cn(
                'block text-xs font-medium mb-2',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Search
              </label>
              <div className="relative">
                <Search className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                  theme === 'dark' ? "text-gray-500" : "text-gray-400"
                )} />
                <input
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients, conditions..."
                  className={cn(
                    "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
                    "border transition-colors",
                    theme === 'dark'
                      ? "bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-700 placeholder-gray-400"
                  )}
                />
              </div>
            </div>
          </div>
        }
      >
        {/* Stats Grid */}
        <div className="mb-8">
          {renderStatsGrid}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className={cn(
            'flex items-center justify-between mb-4',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <span className="text-xs">Click to navigate</span>
          </div>
          {renderQuickActions}
        </div>

        {/* Patient Table */}
        <div className="mb-8">
          <div className={cn(
            'flex items-center justify-between mb-4',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            <h3 className="text-lg font-semibold">Patient Activity</h3>
            <button className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
              theme === 'dark'
                ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            )}>
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {renderPatientTable}
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cn(
            'p-6 rounded-2xl border',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
          )}>
            <h4 className={cn(
              'text-sm font-semibold mb-4',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Patient Visits Trend
            </h4>
            <div className={cn(
              'h-48 rounded-lg flex items-center justify-center',
              theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100/50'
            )}>
              <span className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Chart visualization
              </span>
            </div>
          </div>
          <div className={cn(
            'p-6 rounded-2xl border',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
          )}>
            <h4 className={cn(
              'text-sm font-semibold mb-4',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Condition Distribution
            </h4>
            <div className={cn(
              'h-48 rounded-lg flex items-center justify-center',
              theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100/50'
            )}>
              <span className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Pie chart visualization
              </span>
            </div>
          </div>
        </div>
      </ContentSection>
    </div>
  );
};

export default Dashboard;
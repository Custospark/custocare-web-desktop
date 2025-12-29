import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, Users, Clock, AlertCircle, PhoneIncoming, Stethoscope } from 'lucide-react';

// Hard-coded data relevant to a healthcare receptionist
const todayAppointments = [
  { time: '08:00', patient: 'John Smith', doctor: 'Dr. Anderson', status: 'confirmed' },
  { time: '08:30', patient: 'Maria Garcia', doctor: 'Dr. Lee', status: 'checked-in' },
  { time: '09:00', patient: 'Robert Chen', doctor: 'Dr. Patel', status: 'confirmed' },
  { time: '09:30', patient: 'Emma Wilson', doctor: 'Dr. Anderson', status: 'no-show' },
  { time: '10:00', patient: 'Liam Brown', doctor: 'Dr. Lee', status: 'waiting' },
  { time: '10:30', patient: 'Olivia Taylor', doctor: 'Dr. Patel', status: 'confirmed' },
  { time: '11:00', patient: 'Noah Martinez', doctor: 'Dr. Anderson', status: 'confirmed' },
];

const appointmentsByHour = [
  { hour: '8 AM', count: 6 },
  { hour: '9 AM', count: 8 },
  { hour: '10 AM', count: 10 },
  { hour: '11 AM', count: 7 },
  { hour: '12 PM', count: 4 },
  { hour: '1 PM', count: 9 },
  { hour: '2 PM', count: 11 },
  { hour: '3 PM', count: 8 },
  { hour: '4 PM', count: 5 },
];

const patientStatusData = [
  { name: 'Checked In', value: 18, color: '#10b981' },
  { name: 'Waiting', value: 12, color: '#f59e0b' },
  { name: 'In Consultation', value: 8, color: '#3b82f6' },
  { name: 'Completed', value: 25, color: '#6b7280' },
];

const weeklyTrend = [
  { day: 'Mon', appointments: 48, walkIns: 8 },
  { day: 'Tue', appointments: 52, walkIns: 12 },
  { day: 'Wed', appointments: 45, walkIns: 6 },
  { day: 'Thu', appointments: 58, walkIns: 15 },
  { day: 'Fri', appointments: 61, walkIns: 18 },
  { day: 'Sat', appointments: 32, walkIns: 10 },
  { day: 'Sun', appointments: 0, walkIns: 0 },
];

export default function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reception Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's today's overview.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today's Date</p>
            <p className="text-lg font-semibold">December 28, 2025</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Patients Waiting</p>
              <p className="text-3xl font-bold mt-2">12</p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Appointments</p>
              <p className="text-3xl font-bold mt-2">63</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-3xl font-bold mt-2">18</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Walk-ins Today</p>
              <p className="text-3xl font-bold mt-2">14</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <PhoneIncoming className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Hour */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Appointments by Hour (Today)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentsByHour}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Status Pie */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Current Patient Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={patientStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {patientStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">This Week's Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="appointments"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="Scheduled"
              />
              <Line
                type="monotone"
                dataKey="walkIns"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="Walk-ins"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Upcoming Appointments */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <span>Upcoming Today</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {todayAppointments.map((appt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{appt.patient}</p>
                  <p className="text-xs text-muted-foreground">
                    {appt.time} • {appt.doctor}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {appt.status === 'checked-in' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Checked In
                    </span>
                  )}
                  {appt.status === 'waiting' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Waiting
                    </span>
                  )}
                  {appt.status === 'no-show' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      No Show
                    </span>
                  )}
                  {appt.status === 'confirmed' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
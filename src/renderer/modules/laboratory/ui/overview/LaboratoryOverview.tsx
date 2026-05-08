import { Activity, FlaskConical, Microscope, Receipt } from 'lucide-react';

interface LaboratoryOverviewProps {
  theme: 'light' | 'dark';
}

const LaboratoryOverview = ({ theme }: LaboratoryOverviewProps) => {
  const isDark = theme === 'dark';
  const cardClass = isDark
    ? 'border-gray-800 bg-gray-900 text-gray-100'
    : 'border-gray-200 bg-white text-gray-900';

  return (
    <div className={isDark ? 'bg-gray-950 min-h-screen p-6' : 'bg-gray-50 min-h-screen p-6'}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className={`rounded-2xl border p-6 ${cardClass}`}>
          <h1 className="text-2xl font-bold">Laboratory Intelligence</h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Diagnostic operations at a glance across requests, results, and billable throughput.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-semibold">Pending Requests</p>
            </div>
            <p className="mt-3 text-2xl font-bold">--</p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold">Completed Results</p>
            </div>
            <p className="mt-3 text-2xl font-bold">--</p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-semibold">Billable Charges</p>
            </div>
            <p className="mt-3 text-2xl font-bold">--</p>
          </div>
          <div className={`rounded-xl border p-5 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-500" />
              <p className="text-sm font-semibold">Turnaround Time</p>
            </div>
            <p className="mt-3 text-2xl font-bold">--</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryOverview;
interface TripPriorityBadgeProps { priority: string; isDark: boolean; }
const TripPriorityBadge = ({ priority, isDark }: TripPriorityBadgeProps) => {
  const colors: Record<string, string> = {
    urgent: isDark ? 'bg-red-900/30 text-red-300 border-red-800/30' : 'bg-red-50 text-red-700 border-red-200',
    high: isDark ? 'bg-orange-900/30 text-orange-300 border-orange-800/30' : 'bg-orange-50 text-orange-700 border-orange-200',
    medium: isDark ? 'bg-amber-900/30 text-amber-300 border-amber-800/30' : 'bg-amber-50 text-amber-700 border-amber-200',
    low: isDark ? 'bg-green-900/30 text-green-300 border-green-800/30' : 'bg-green-50 text-green-700 border-green-200',
  };
  const c = colors[priority] ?? colors.medium;
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${c}`}>{priority}</span>;
};
export default TripPriorityBadge;

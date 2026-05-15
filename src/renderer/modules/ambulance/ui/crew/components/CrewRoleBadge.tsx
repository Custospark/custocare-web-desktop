interface CrewRoleBadgeProps { role: string; isDark: boolean; }
const colors: Record<string, string> = {
  driver: 'bg-blue-100 text-blue-700 border-blue-200',
  paramedic: 'bg-green-100 text-green-700 border-green-200',
  emt: 'bg-amber-100 text-amber-700 border-amber-200',
  attendant: 'bg-purple-100 text-purple-700 border-purple-200',
  nurse: 'bg-pink-100 text-pink-700 border-pink-200',
  doctor: 'bg-red-100 text-red-700 border-red-200',
  crew_lead: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};
const darkColors: Record<string, string> = {
  driver: 'bg-blue-900/30 text-blue-300 border-blue-800/30',
  paramedic: 'bg-green-900/30 text-green-300 border-green-800/30',
  emt: 'bg-amber-900/30 text-amber-300 border-amber-800/30',
  attendant: 'bg-purple-900/30 text-purple-300 border-purple-800/30',
  nurse: 'bg-pink-900/30 text-pink-300 border-pink-800/30',
  doctor: 'bg-red-900/30 text-red-300 border-red-800/30',
  crew_lead: 'bg-indigo-900/30 text-indigo-300 border-indigo-800/30',
};
const CrewRoleBadge = ({ role, isDark }: CrewRoleBadgeProps) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${isDark ? (darkColors[role] ?? '') : (colors[role] ?? '')}`}>
    {role.replace(/_/g, ' ')}
  </span>
);
export default CrewRoleBadge;

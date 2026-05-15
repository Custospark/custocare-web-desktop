interface VehicleStatusBadgeProps {
  status: string;
  isDark: boolean;
}

const statusConfig = (isDark: boolean): Record<string, { bg: string; text: string; dot: string }> => ({
  available: {
    bg: isDark ? 'bg-green-900/30' : 'bg-green-50',
    text: isDark ? 'text-green-300' : 'text-green-700',
    dot: 'bg-green-500',
  },
  in_service: {
    bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    text: isDark ? 'text-blue-300' : 'text-blue-700',
    dot: 'bg-blue-500',
  },
  out_of_service: {
    bg: isDark ? 'bg-gray-800' : 'bg-gray-100',
    text: isDark ? 'text-gray-400' : 'text-gray-600',
    dot: 'bg-gray-400',
  },
  maintenance: {
    bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
    text: isDark ? 'text-red-300' : 'text-red-700',
    dot: 'bg-red-500',
  },
  decommissioned: {
    bg: isDark ? 'bg-gray-800' : 'bg-gray-100',
    text: isDark ? 'text-gray-500' : 'text-gray-500',
    dot: 'bg-gray-400',
  },
});

const VehicleStatusBadge = ({ status, isDark }: VehicleStatusBadgeProps) => {
  const cfg = statusConfig(isDark)[status] ?? statusConfig(isDark).out_of_service;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default VehicleStatusBadge;

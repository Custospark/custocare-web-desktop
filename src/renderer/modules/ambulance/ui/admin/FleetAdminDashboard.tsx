import { useNavigate } from 'react-router-dom';
import { Truck, Users, BarChart3, ArrowRight } from 'lucide-react';
import { AMBULANCE_ROUTES } from '../../../../app/routes/routeConstants';

interface FleetAdminDashboardProps { theme: 'light' | 'dark'; }

const FleetAdminDashboard = ({ theme }: FleetAdminDashboardProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const cards = [
    {
      label: 'Ambulance Fleet',
      description: 'Register, maintain, and track vehicles',
      icon: <Truck className="h-6 w-6" />,
      route: AMBULANCE_ROUTES.FLEET_ASSETS,
      color: 'blue',
      sublinks: [
        { label: 'Vehicles & crew', route: AMBULANCE_ROUTES.FLEET_ASSETS },
        { label: 'Service schedule', route: AMBULANCE_ROUTES.FLEET_ASSETS },
      ],
    },
    {
      label: 'Crew Management',
      description: 'Assign staff to vehicles, manage roles',
      icon: <Users className="h-6 w-6" />,
      route: AMBULANCE_ROUTES.FLEET_DISPATCH,
      color: 'green',
      sublinks: [
        { label: 'Live dispatch', route: AMBULANCE_ROUTES.FLEET_DISPATCH },
        { label: 'Trip history', route: AMBULANCE_ROUTES.FLEET_DISPATCH },
      ],
    },
    {
      label: 'Fleet Analytics',
      description: 'Trip volume, response times, mileage reports',
      icon: <BarChart3 className="h-6 w-6" />,
      route: AMBULANCE_ROUTES.FLEET_ANALYTICS,
      color: 'purple',
      sublinks: [],
    },
  ];

  const colorStyles: Record<string, { bg: string; text: string; border: string; iconBg: string; hover: string }> = {
    blue: {
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      text: isDark ? 'text-blue-300' : 'text-blue-700',
      border: isDark ? 'border-blue-800/30' : 'border-blue-200',
      iconBg: isDark ? 'bg-blue-800/30' : 'bg-blue-100',
      hover: isDark ? 'hover:bg-blue-900/30' : 'hover:bg-blue-100',
    },
    green: {
      bg: isDark ? 'bg-green-900/20' : 'bg-green-50',
      text: isDark ? 'text-green-300' : 'text-green-700',
      border: isDark ? 'border-green-800/30' : 'border-green-200',
      iconBg: isDark ? 'bg-green-800/30' : 'bg-green-100',
      hover: isDark ? 'hover:bg-green-900/30' : 'hover:bg-green-100',
    },
    purple: {
      bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      text: isDark ? 'text-purple-300' : 'text-purple-700',
      border: isDark ? 'border-purple-800/30' : 'border-purple-200',
      iconBg: isDark ? 'bg-purple-800/30' : 'bg-purple-100',
      hover: isDark ? 'hover:bg-purple-900/30' : 'hover:bg-purple-100',
    },
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Fleet Administration</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage vehicles, crew assignments, and fleet analytics
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map(card => {
            const c = colorStyles[card.color];
            return (
              <div key={card.label}
                className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                {/* Header */}
                <button onClick={() => navigate(card.route)}
                  className={`w-full cursor-pointer p-5 text-left transition-all ${c.hover}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`rounded-lg p-2.5 inline-block ${c.iconBg}`}>{card.icon}</div>
                      <h3 className={`mt-3 font-semibold ${c.text}`}>{card.label}</h3>
                      <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.description}</p>
                    </div>
                    <ArrowRight className={`h-5 w-5 ${c.text}`} />
                  </div>
                </button>

                {/* Sublinks */}
                {card.sublinks.length > 0 && (
                  <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    {card.sublinks.map(link => (
                      <button key={link.label} onClick={() => navigate(link.route)}
                        className={`flex w-full cursor-pointer items-center gap-2 px-5 py-2.5 text-sm transition-all ${
                          isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'
                        }`}>
                        <ArrowRight className="h-3 w-3" />
                        {link.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FleetAdminDashboard;

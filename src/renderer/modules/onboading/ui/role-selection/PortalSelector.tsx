/**
 * ============================================================================
 * PREMIUM PORTAL SELECTOR V2 - STRUCTURED LAYOUT WITH ENTERPRISE UX
 * ============================================================================
 * 
 * DESIGN INSPIRED BY REFERENCE:
 * 1. ✅ Clean, organized workspace cards with images
 * 2. ✅ Clear separation between Professional and Personal sections
 * 3. ✅ Horizontal card layout with image + details
 * 4. ✅ Active status indicators
 * 5. ✅ Professional role badges
 * 6. ✅ Clear CTAs with arrow icons
 * 7. ✅ Personal access section with distinct styling
 * 8. ✅ Footer actions (Register facility, Contact support)
 * 
 * ENHANCEMENTS:
 * - Premium gradients and animations
 * - Dark/light theme support
 * - Smooth transitions
 * - Enterprise-grade polish
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {ROUTES} from '../../routes/onboardingRouteConstants'
import { 
  Heart,
  ArrowRight,
  Shield,
  Activity,
  Users,
  FileText,
  Calendar,
  Briefcase,
  Sparkles,
  Sun,
  Moon,
  Plus,
  HeadphonesIcon,
  MapPin,
  User,
} from 'lucide-react';
import { cn } from '../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { logout } from '../../../../app/store/slices/authSlice';

/* ==========================================================================
   REMOTE IMAGES (Professional Healthcare)
   ========================================================================== */
const IMAGES = {
  // Professional Workspaces
  cityHospital: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop&q=80',
  northsideClinic: 'https://images.unsplash.com/photo-1519494140681-8b17d830a3e9?w=400&h=300&fit=crop&q=80',
  emeraldMedical: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=300&fit=crop&q=80',
  
  // Personal Portal
  patientPortal: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop&q=80',
  
  // User Avatar
  userAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80'
};

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */
interface Workspace {
  id: string;
  name: string;
  department: string;
  role: string;
  description: string;
  image: string;
  status: 'active' | 'pending' | 'inactive';
  location?: string;
  patients?: number;
  route: string;
}

interface User {
  name: string;
  role: string;
  avatar: string;
  patientId?: string;
}

/* ==========================================================================
   ANIMATION VARIANTS
   ========================================================================== */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};


/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const PortalSelectorV2: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  
  /* State Management */
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  /* Mock User Data */
  const user: User = {
    name: "Dr. Smith",
    role: "Healthcare Professional",
    avatar: IMAGES.userAvatar,
    patientId: "CP-1234-A-2"
  };

  /* Professional Workspaces Configuration */
  const professionalWorkspaces: Workspace[] = useMemo(() => [
    {
      id: 'city-hospital',
      name: 'City General Hospital',
      department: 'EMERGENCY DEPT',
      role: 'ATTENDING PHYSICIAN',
      description: 'Level 1 Trauma Center dashboard. Manage acute care patient lists, staff scheduling, and emergency triage protocols.',
      image: IMAGES.cityHospital,
      status: 'active',
      location: 'Downtown Medical District',
      patients: 247,
      route: ROUTES.STAFF_DASHBOARD
    },
    {
      id: 'northside-clinic',
      name: 'Northside Clinic',
      department: 'PEDIATRICS',
      role: 'CONSULTANT',
      description: 'Outpatient pediatric care. Access patient history, vaccination records, and scheduled consultations.',
      image: IMAGES.northsideClinic,
      status: 'active',
      location: 'Northside Medical Plaza',
      patients: 189,
      route: ROUTES.STAFF_DASHBOARD
    },
    {
      id: 'emerald-medical',
      name: 'Emerald Medical Center',
      department: 'CARDIOLOGY',
      role: 'SPECIALIST',
      description: 'Specialized cardiovascular care facility. Monitor cardiac patients, review diagnostic results, and coordinate treatment plans.',
      image: IMAGES.emeraldMedical,
      status: 'active',
      location: 'Emerald Health Campus',
      patients: 156,
      route: ROUTES.STAFF_DASHBOARD
    }
  ], []);

  /* Theme-aware Design System */
  const designSystem = useMemo(() => ({
    colors: {
      primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      tertiary: theme === 'dark' ? 'text-gray-500' : 'text-gray-500',
      accent: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
      background: theme === 'dark' 
        ? 'bg-gray-950' 
        : 'bg-gray-50',
      card: theme === 'dark' 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-white border-gray-200',
      cardHover: theme === 'dark'
        ? 'hover:bg-gray-800/80 hover:border-gray-700'
        : 'hover:bg-gray-50 hover:border-gray-300',
      badge: theme === 'dark'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  }), [theme]);

  /* Navigation Handlers */
  const handleWorkspaceSelect = (workspace: Workspace) => {
    navigate(workspace.route, {
      state: {
        user,
        workspace,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handlePatientPortal = () => {
    navigate(ROUTES.PATIENT_DASHBOARD, {
      state: {
        user,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleRegisterFacility = () => {
    navigate('/register-facility');
  };

  const handleContactSupport = () => {
    navigate('/support');
  };

 const {showToast}=useToast();
 
   const handleLogout = () => {
     dispatch(logout());
     showToast(
       'info',
       'You’ve been logged out successfully. Thank you for using CustoCare AI — see you again soon!',
       8000
     );
     navigate(ROUTES.LANDING);
   };

  /* ==========================================================================
     RENDER COMPONENTS
     ========================================================================== */

  /* Header */
  const renderHeader = () => (
    <header className={cn(
      "sticky top-0 z-50 border-b",
      theme === 'dark' 
        ? "bg-gray-950 border-gray-800" 
        : "bg-white border-gray-200"
    )}>
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-gradient-to-br from-blue-600 to-cyan-600"
            )}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className={cn(
              "text-lg font-bold",
              designSystem.colors.primary
            )}>
              CustoCare AI
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                theme === 'dark'
                  ? "hover:bg-gray-800 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              Logout
            </button>

            {/* User Avatar */}
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 shadow-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );

  /* Welcome Header */
  const renderWelcomeHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className={cn(
        "text-3xl font-bold mb-2",
        designSystem.colors.primary
      )}>
        Welcome back, {user.name}
      </h1>
      <p className={cn(
        "text-base",
        designSystem.colors.secondary
      )}>
        Please select a workspace to continue or access your personal portal.
      </p>
    </motion.div>
  );

  /* Professional Workspaces Section */
  const renderProfessionalWorkspaces = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mb-12"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-blue-500/10"
        )}>
          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className={cn(
          "text-xl font-bold",
          designSystem.colors.primary
        )}>
          Professional Workspaces
        </h2>
      </div>

      {/* Workspace Cards */}
      <div className="space-y-4">
        {professionalWorkspaces.map((workspace) => (
          <motion.div
            key={workspace.id}
            onHoverStart={() => setHoveredCard(workspace.id)}
            onHoverEnd={() => setHoveredCard(null)}
            onClick={() => handleWorkspaceSelect(workspace)}
            className={cn(
              "group relative rounded-xl border overflow-hidden cursor-pointer",
              "transition-all duration-300",
              designSystem.colors.card,
              designSystem.colors.cardHover,
              "shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex flex-col sm:flex-row">
              {/* Image Section */}
              <div className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                <img
                  src={workspace.image}
                  alt={workspace.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient Overlay */}
                <div className={cn(
                  "absolute inset-0",
                  theme === 'dark'
                    ? "bg-gradient-to-r from-transparent to-gray-900/40"
                    : "bg-gradient-to-r from-transparent to-white/40"
                )} />
              </div>

              {/* Content Section */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={cn(
                        "text-lg font-bold",
                        designSystem.colors.primary
                      )}>
                        {workspace.name}
                      </h3>
                      {/* Active Badge */}
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                        designSystem.colors.badge,
                        "border"
                      )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </div>
                    </div>

                    {/* Department & Role */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        "text-blue-600 dark:text-blue-400"
                      )}>
                        {workspace.department}
                      </span>
                      <span className={cn(
                        "text-xs",
                        designSystem.colors.tertiary
                      )}>
                        •
                      </span>
                      <span className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        "text-purple-600 dark:text-purple-400"
                      )}>
                        {workspace.role}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={cn(
                      "text-sm mb-4 line-clamp-2",
                      designSystem.colors.secondary
                    )}>
                      {workspace.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs">
                      {workspace.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className={cn(
                            "w-3.5 h-3.5",
                            designSystem.colors.tertiary
                          )} />
                          <span className={designSystem.colors.secondary}>
                            {workspace.location}
                          </span>
                        </div>
                      )}
                      {workspace.patients && (
                        <div className="flex items-center gap-1.5">
                          <Users className={cn(
                            "w-3.5 h-3.5",
                            designSystem.colors.tertiary
                          )} />
                          <span className={designSystem.colors.secondary}>
                            {workspace.patients} Patients
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    className={cn(
                      "ml-4 px-5 py-2.5 rounded-lg font-medium text-sm",
                      "flex items-center gap-2 flex-shrink-0",
                      "transition-all duration-300",
                      "bg-blue-600 text-white hover:bg-blue-700",
                      "transform hover:scale-105 shadow-sm hover:shadow-md"
                    )}
                  >
                    Enter Dashboard
                    <ArrowRight className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      hoveredCard === workspace.id && "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  /* Personal Access Section */
  const renderPersonalAccess = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-12"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-purple-500/10"
        )}>
          <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className={cn(
          "text-xl font-bold",
          designSystem.colors.primary
        )}>
          Personal Access
        </h2>
      </div>

      {/* Patient Portal Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "rounded-xl border p-8",
          designSystem.colors.card,
          "shadow-sm hover:shadow-md transition-all duration-300"
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-purple-500 to-pink-500"
              )}>
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={cn(
                  "text-lg font-bold",
                  designSystem.colors.primary
                )}>
                  My Patient Portal
                </h3>
                <p className={cn(
                  "text-sm",
                  designSystem.colors.tertiary
                )}>
                  View your personal records
                </p>
              </div>
            </div>

            <p className={cn(
              "text-sm mb-4",
              designSystem.colors.secondary
            )}>
              Access your own test results, upcoming appointments, and billing information 
              for your personal care.
            </p>

            {/* Quick Features */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: FileText, label: 'Test Results' },
                { icon: Calendar, label: 'Appointments' },
                { icon: Activity, label: 'Health Records' }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
                    theme === 'dark'
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  <feature.icon className="w-3.5 h-3.5" />
                  {feature.label}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handlePatientPortal}
            className={cn(
              "px-6 py-3 rounded-lg font-medium text-sm",
              "flex items-center gap-2 flex-shrink-0",
              "transition-all duration-300",
              "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
              "hover:from-purple-700 hover:to-pink-700",
              "transform hover:scale-105 shadow-md hover:shadow-lg"
            )}
          >
            <Sparkles className="w-4 h-4" />
            View My Health
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  /* Footer Actions */
  const renderFooterActions = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="flex flex-wrap items-center gap-4 pb-8"
    >
      <button
        onClick={handleRegisterFacility}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          "transition-all duration-200",
          theme === 'dark'
            ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        )}
      >
        <Plus className="w-4 h-4" />
        Register New Facility
      </button>

      <button
        onClick={handleContactSupport}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          "transition-all duration-200",
          theme === 'dark'
            ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        )}
      >
        <HeadphonesIcon className="w-4 h-4" />
        Contact Support
      </button>

      {/* Copyright */}
      <div className="ml-auto text-xs text-gray-500 dark:text-gray-600">
        © 2023 CustoCare AI. All rights reserved.
      </div>
    </motion.div>
  );

  /* ==========================================================================
     MAIN RENDER
     ========================================================================== */
  return (
    <div className={cn(
      "min-h-screen",
      designSystem.colors.background
    )}>
      {renderHeader()}

      <main className="max-w-6xl mx-auto px-6 py-8">
        {renderWelcomeHeader()}
        {renderProfessionalWorkspaces()}
        {renderPersonalAccess()}
        {renderFooterActions()}
      </main>
    </div>
  );
};

export default PortalSelectorV2;
/**
 * ============================================================================
 * PREMIUM ROLE SELECTION - WORLD-CLASS UX/UI FOR HEALTHCARE ONBOARDING
 * ============================================================================
 * 
 * COMPLETE DESIGN PHILOSOPHY:
 * 
 * KEY FEATURES:
 * 1. ✅ Three distinct role paths with personality
 * 2. ✅ Smooth animations and micro-interactions
 * 3. ✅ Interactive hover states with visual feedback
 * 4. ✅ Dynamic background gradients
 * 5. ✅ Role-specific imagery and iconography
 * 6. ✅ Trust indicators and statistics
 * 7. ✅ Mobile-responsive design
 * 8. ✅ Dark/Light theme support
 * 9. ✅ Accessibility-first approach
 * 10.✅ Professional testimonials per role
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hospital,
  Building2,
  Stethoscope,
  Heart,
  Activity,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  Globe,
  Award,
  TrendingUp,
  Sparkles,
  Sun,
  Moon,
  Clock,
  BadgeCheck,
  Star,
  ChevronRight,
  Brain,
  UserCheck,
  Building,
  Pill,
  FileHeart,
  HeartPulse,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import {ROUTES} from '../../routes/onboardingRouteConstants'
import { type ComponentType, type SVGProps } from 'react';


/* ==========================================================================
   REMOTE IMAGES (Unsplash - Healthcare Focused)
   ========================================================================== */
const IMAGES = {
  heroBg: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=900&fit=crop&q=80',
  medicalProfessional: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop&q=80',
  patient: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop&q=80',
  facility: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop&q=80',
  doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&q=80',
  patientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80',
  adminAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&q=80',
  backgroundPattern: 'https://images.unsplash.com/photo-1631248055255-4649b3b6f0e4?w=1600&h=900&fit=crop&q=20'
};

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */
   type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
interface Role {
  id: string;
  title: string;
  subtitle: string;
  description: string;

  icon: IconComponent;

  gradient: string;
  hoverGradient: string;
  image: string;
  route: string;

  benefits: string[];

  stats: {
    label: string;
    value: string;
    icon: IconComponent;
  }[];

  testimonial: {
    name: string;
    role: string;
    quote: string;
    avatar: string;
    rating: number;
  };

  features: {
    icon: IconComponent;
    text: string;
  }[];
}


/* ==========================================================================
   ROLE DATA - UPDATED ROUTES
   ========================================================================== */
const ROLES: Role[] = [
  {
    id: 'medical-professional',
    title: 'Medical Professional',
    subtitle: 'Doctors, Nurses, Specialists & Healthcare Providers',
    description: 'Streamline your practice with AI-powered tools. Manage patients efficiently, access verified credentials instantly, and connect with 50,000+ healthcare facilities nationwide.',
    icon: Stethoscope,
    gradient: 'from-blue-600 via-cyan-500 to-blue-600',
    hoverGradient: 'from-blue-700 via-cyan-600 to-blue-700',
    image: IMAGES.medicalProfessional,
    route: ROUTES.STAFF_ONBOARDING, // ✅ UPDATED ROUTE
    benefits: [
      'Instant credential verification',
      'AI-powered patient management',
      'Secure HIPAA-compliant platform',
      'Connect with 50K+ facilities',
      'Real-time appointment scheduling',
      'Automated billing & documentation'
    ],
    stats: [
      { label: 'Active Providers', value: '50K+', icon: Users },
      { label: 'Avg. Setup Time', value: '5 min', icon: Clock },
      { label: 'Satisfaction', value: '98%', icon: Heart }
    ],
    testimonial: {
      name: 'Dr. Sarah Mitchell',
      role: 'Cardiologist, Johns Hopkins Hospital',
      quote: 'CustoCare reduced my administrative workload by 60%. I now spend more time with patients and less on paperwork. The credential verification was instant!',
      avatar: IMAGES.doctorAvatar,
      rating: 5
    },
    features: [
      { icon: Brain, text: 'AI Clinical Assistant' },
      { icon: Shield, text: 'HIPAA Compliant' },
      { icon: Calendar, text: 'Smart Scheduling' },
      { icon: FileHeart, text: 'Digital Records' }
    ]
  },
  {
    id: 'patient',
    title: 'Patient',
    subtitle: 'Individuals Seeking Quality Healthcare',
    description: 'Take control of your health journey. Find verified doctors, book appointments instantly, access your medical records securely, and get personalized care recommendations.',
    icon: Heart,
    gradient: 'from-emerald-600 via-teal-500 to-emerald-600',
    hoverGradient: 'from-emerald-700 via-teal-600 to-emerald-700',
    image: IMAGES.patient,
    route: ROUTES.PATIENT_ONBOARDING, // ✅ UPDATED ROUTE
    benefits: [
      'Find verified healthcare providers',
      'Instant appointment booking',
      'Secure health record access',
      'Telemedicine consultations',
      'Prescription management',
      'Health insights & reminders'
    ],
    stats: [
      { label: 'Patients Served', value: '2M+', icon: Users },
      { label: 'Avg. Wait Time', value: '<24h', icon: Clock },
      { label: 'User Rating', value: '4.9★', icon: Star }
    ],
    testimonial: {
      name: 'Emily Rodriguez',
      role: 'CustoCare Patient since 2023',
      quote: 'Finding a specialist used to take weeks. With CustoCare, I booked an appointment in minutes. The telemedicine feature saved me during the pandemic!',
      avatar: IMAGES.patientAvatar,
      rating: 5
    },
    features: [
      { icon: UserCheck, text: 'Verified Doctors' },
      { icon: HeartPulse, text: 'Health Tracking' },
      { icon: MessageSquare, text: 'Chat with Doctors' },
      { icon: Pill, text: 'Rx Management' }
    ]
  },
  {
    id: 'facility-owner',
    title: 'Healthcare Facility Owner',
    subtitle: 'Hospitals, Clinics, Labs & Healthcare Organizations',
    description: 'Transform your facility operations with enterprise-grade AI tools. Optimize resource allocation, improve patient flow, and boost revenue by 40% on average within 6 months.',
    icon: Building2,
    gradient: 'from-purple-600 via-pink-500 to-purple-600',
    hoverGradient: 'from-purple-700 via-pink-600 to-purple-700',
    image: IMAGES.facility,
    route: ROUTES.HEALTHCARE_ONBOARDING, 
    benefits: [
      'AI operations management',
      '60% efficiency improvement',
      'Provider network integration',
      'Revenue optimization tools',
      'Automated compliance reporting',
      'Real-time analytics dashboard'
    ],
    stats: [
      { label: 'Facilities', value: '5K+', icon: Building },
      { label: 'Revenue Increase', value: '+40%', icon: TrendingUp },
      { label: 'ROI Timeline', value: '6 mo', icon: Zap }
    ],
    testimonial: {
      name: 'Maria Chen',
      role: 'COO, Metropolitan General Hospital',
      quote: 'CustoCare transformed our operations. Patient satisfaction increased by 50%, staff efficiency improved dramatically, and our revenue grew 40% in just 6 months.',
      avatar: IMAGES.adminAvatar,
      rating: 5
    },
    features: [
      { icon: Activity, text: 'Operations AI' },
      { icon: Globe, text: 'Provider Network' },
      { icon: TrendingUp, text: 'Revenue Analytics' },
      { icon: Shield, text: 'Compliance Tools' }
    ]
  }
];

/* ==========================================================================
   ANIMATION VARIANTS
   ========================================================================== */

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};



/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const RoleSelection: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  /* Auto-scroll to details when role is selected */
  useEffect(() => {
    if (selectedRole && showDetails) {
      setTimeout(() => {
        document.getElementById('role-details')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [selectedRole, showDetails]);

  /* Theme-aware Design System */
  const designSystem = useMemo(() => ({
    colors: {
      primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      accent: theme === 'dark' ? 'text-cyan-400' : 'text-blue-600',
      background: theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50',
      card: theme === 'dark' 
        ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700' 
        : 'bg-white/90 backdrop-blur-sm border-gray-200',
      cardHover: theme === 'dark'
        ? 'hover:bg-gray-800 hover:border-gray-600'
        : 'hover:bg-white hover:border-gray-300'
    },
    spacing: {
      section: 'py-12 px-4 sm:px-6 lg:px-8',
      container: 'max-w-7xl mx-auto',
      card: 'p-6 sm:p-8'
    },
    typography: {
      h1: 'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight',
      h2: 'text-3xl sm:text-4xl font-bold',
      h3: 'text-2xl sm:text-3xl font-bold',
      h4: 'text-xl font-semibold',
      body: 'text-base leading-relaxed',
      small: 'text-sm'
    }
  }), [theme]);

  /* Get selected role data */
  const selectedRoleData = useMemo(() => {
    return ROLES.find(role => role.id === selectedRole);
  }, [selectedRole]);

  /* Handle role selection */
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setShowDetails(true);
  };

  /* Handle continue to onboarding - UPDATED TO USE NEW ROUTES */
  const handleContinue = () => {
    if (selectedRoleData) {
      navigate(selectedRoleData.route); // This will now navigate to /patient, /professional, or /facility
    }
  };

  /* ==========================================================================
     RENDER COMPONENTS
     ========================================================================== */

  /* Hero Section */
  const renderHero = () => (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl mb-12"
    >
      <div className="absolute inset-0">
        <img 
          src={IMAGES.heroBg}
          alt="Healthcare excellence"
          className="w-full h-full object-cover"
        />
        <div className={cn(
          "absolute inset-0",
          theme === 'dark' 
            ? "bg-gradient-to-r from-gray-950/95 via-gray-900/90 to-gray-950/95"
            : "bg-gradient-to-r from-blue-950/70 via-blue-900/60 to-blue-950/70"
        )} />
      </div>
      
      <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md mb-6 border border-white/20"
          >
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-sm text-white font-semibold">
              Welcome to CustoCare AI Healthcare Platform
            </span>
          </motion.div>
          
          <h1 className={cn(
            designSystem.typography.h1,
            "text-white mb-6 leading-tight"
          )}>
            Choose Your Healthcare Journey
          </h1>
          
          <p className="text-xl text-blue-100/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join 2 million+ users transforming healthcare with AI-powered tools. 
            Select your role to get started with personalized onboarding.
          </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <BadgeCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm text-white font-medium">HIPAA Compliant</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-white font-medium">ISO 27001 Certified</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-white font-medium">2M+ Active Users</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-sm text-white font-medium">4.9/5 Rating</span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  /* Role Cards */
  const renderRoleCards = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
    >
      {ROLES.map((role, index) => {
        const isSelected = selectedRole === role.id;
        const isHovered = hoveredRole === role.id;
        const Icon = role.icon;

        return (
          <motion.div
            key={role.id}
            onMouseEnter={() => setHoveredRole(role.id)}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => handleRoleSelect(role.id)}
            className={cn(
              "relative overflow-hidden rounded-2xl border-2 cursor-pointer transition-all duration-500",
              "transform hover:scale-105 hover:shadow-2xl",
              isSelected 
                ? "border-transparent shadow-2xl" 
                : "border-gray-300 dark:border-gray-700 shadow-lg",
              designSystem.colors.cardHover
            )}
          >
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0">
              <img 
                src={role.image}
                alt={role.title}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-700",
                  isHovered && "scale-110"
                )}
              />
              <div className={cn(
                "absolute inset-0 transition-all duration-500",
                isSelected || isHovered
                  ? `bg-gradient-to-br ${role.gradient} opacity-95`
                  : theme === 'dark'
                  ? "bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95"
                  : "bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95"
              )} />
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <motion.div
                  animate={{ 
                    scale: isSelected || isHovered ? 1.1 : 1,
                    rotate: isHovered ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
                    isSelected || isHovered
                      ? "bg-white/20 backdrop-blur-sm shadow-lg"
                      : theme === 'dark'
                      ? "bg-gray-800/50"
                      : "bg-white/80"
                  )}
                >
                  <Icon className={cn(
                    "w-8 h-8",
                    isSelected || isHovered
                      ? "text-white"
                      : theme === 'dark'
                      ? "text-cyan-400"
                      : "text-blue-600"
                  )} />
                </motion.div>

                <h3 className={cn(
                  "text-2xl font-bold mb-2",
                  isSelected || isHovered ? "text-white" : designSystem.colors.primary
                )}>
                  {role.title}
                </h3>
                <p className={cn(
                  "text-sm mb-4",
                  isSelected || isHovered 
                    ? "text-white/80" 
                    : designSystem.colors.secondary
                )}>
                  {role.subtitle}
                </p>
                <p className={cn(
                  "text-sm leading-relaxed",
                  isSelected || isHovered 
                    ? "text-white/90" 
                    : designSystem.colors.secondary
                )}>
                  {role.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {role.stats.map((stat, idx) => {
                  const StatIcon = stat.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + idx * 0.05 }}
                      className={cn(
                        "text-center p-3 rounded-lg",
                        isSelected || isHovered
                          ? "bg-white/10 backdrop-blur-sm"
                          : theme === 'dark'
                          ? "bg-gray-800/30"
                          : "bg-gray-100/80"
                      )}
                    >
                      <StatIcon className={cn(
                        "w-5 h-5 mx-auto mb-1",
                        isSelected || isHovered 
                          ? "text-white" 
                          : "text-blue-600 dark:text-cyan-400"
                      )} />
                      <div className={cn(
                        "text-lg font-bold",
                        isSelected || isHovered 
                          ? "text-white" 
                          : designSystem.colors.primary
                      )}>
                        {stat.value}
                      </div>
                      <div className={cn(
                        "text-xs",
                        isSelected || isHovered 
                          ? "text-white/70" 
                          : designSystem.colors.secondary
                      )}>
                        {stat.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6 flex-1">
                {role.features.map((feature, idx) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + idx * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <FeatureIcon className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isSelected || isHovered 
                          ? "text-white" 
                          : "text-blue-600 dark:text-cyan-400"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected || isHovered 
                          ? "text-white/90" 
                          : designSystem.colors.secondary
                      )}>
                        {feature.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2",
                  "transition-all duration-300",
                  isSelected
                    ? "bg-white text-gray-900 shadow-lg"
                    : isHovered
                    ? "bg-white/20 backdrop-blur-sm text-white border-2 border-white/30"
                    : theme === 'dark'
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Selected
                  </>
                ) : (
                  <>
                    Select Role
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>

            {/* Selection Indicator */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-4 right-4 z-20"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" strokeWidth={2.5} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );

  /* Role Details Section */
  const renderRoleDetails = () => {
    if (!selectedRoleData || !showDetails) return null;

    const Icon = selectedRoleData.icon;

    return (
      <motion.div
        id="role-details"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className={cn(
          "rounded-2xl border overflow-hidden",
          designSystem.colors.card,
          "shadow-2xl"
        )}>
          {/* Header */}
          <div className={cn(
            "p-8 relative overflow-hidden",
            `bg-gradient-to-r ${selectedRoleData.gradient}`
          )}>
            <div className="absolute inset-0 opacity-10">
              <img 
                src={selectedRoleData.image}
                alt={selectedRoleData.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {selectedRoleData.title}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {selectedRoleData.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Benefits */}
            <div className="mb-8">
              <h3 className={cn(
                "text-xl font-bold mb-4",
                designSystem.colors.primary
              )}>
                What You'll Get
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRoleData.benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl",
                      theme === 'dark' 
                        ? "bg-gray-800/50" 
                        : "bg-gray-50"
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
                    <span className={cn(
                      "font-medium",
                      designSystem.colors.primary
                    )}>
                      {benefit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className={cn(
              "p-6 rounded-xl mb-8",
              theme === 'dark' 
                ? "bg-gray-800/50" 
                : "bg-gray-50"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={selectedRoleData.testimonial.avatar}
                  alt={selectedRoleData.testimonial.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
                />
                <div className="flex-1">
                  <h4 className={cn(
                    "font-bold",
                    designSystem.colors.primary
                  )}>
                    {selectedRoleData.testimonial.name}
                  </h4>
                  <p className={cn(
                    "text-sm",
                    designSystem.colors.secondary
                  )}>
                    {selectedRoleData.testimonial.role}
                  </p>
                </div>
                <div className="flex">
                  {[...Array(selectedRoleData.testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className={cn(
                "italic leading-relaxed",
                designSystem.colors.secondary
              )}>
                "{selectedRoleData.testimonial.quote}"
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setShowDetails(false);
                }}
                className={cn(
                  "px-6 py-3 rounded-xl font-medium transition-all duration-200",
                  "border border-gray-300 dark:border-gray-600",
                  "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                Choose Different Role
              </button>
              
              <button
                onClick={handleContinue}
                className={cn(
                  "flex-1 px-8 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3",
                  `bg-gradient-to-r ${selectedRoleData.gradient}`,
                  "text-white hover:shadow-lg transform hover:scale-105",
                  "transition-all duration-300"
                )}
              >
                Continue as {selectedRoleData.title}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  /* ==========================================================================
     MAIN RENDER
     ========================================================================== */
  return (
    <div className={cn("min-h-screen", designSystem.colors.background)}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className={cn(
          designSystem.spacing.section,
          "py-4",
          theme === 'dark' 
            ? "border-gray-800 bg-gray-950/90" 
            : "border-gray-200 bg-white/90"
        )}>
          <div className={cn(designSystem.spacing.container, "flex items-center justify-between")}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg"
              )}>
                <Hospital className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CustoCare AI</h1>
                <p className={cn("text-xs", designSystem.colors.secondary)}>
                  Healthcare Excellence Platform
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => navigate('/login')}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "border border-gray-300 dark:border-gray-600",
                  "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                  "hover:scale-105"
                )}
              >
                Already have an account?
              </button>
              
              <button
                onClick={() => dispatch(toggleTheme())}
                className={cn(
                  "p-3 rounded-lg transition-all duration-200 hover:scale-110",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  theme === 'dark'
                    ? "bg-gray-800 text-amber-400 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(designSystem.spacing.section)}>
        <div className={designSystem.spacing.container}>
          {renderHero()}
          
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className={cn(
                designSystem.typography.h2,
                designSystem.colors.primary,
                "mb-4"
              )}>
                Select Your Role
              </h2>
              <p className={cn(
                "text-lg max-w-2xl mx-auto",
                designSystem.colors.secondary
              )}>
                Choose the option that best describes you. Each role has tailored features and onboarding experience.
              </p>
            </motion.div>
          </div>

          {renderRoleCards()}
          {renderRoleDetails()}
        </div>
      </main>

      {/* Footer */}
      <footer className={cn(
        designSystem.spacing.section,
        "py-8 border-t",
        theme === 'dark' ? "border-gray-800" : "border-gray-200"
      )}>
        <div className={cn(designSystem.spacing.container)}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className={cn(designSystem.colors.secondary, designSystem.typography.small)}>
              © {new Date().getFullYear()} CustoCare AI Inc. • HIPAA Compliant • SOC 2 Certified
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className={cn(
                designSystem.colors.secondary,
                designSystem.typography.small,
                "hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              )}>
                Privacy Policy
              </a>
              <a href="#" className={cn(
                designSystem.colors.secondary,
                designSystem.typography.small,
                "hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              )}>
                Terms of Service
              </a>
              <a href="#" className={cn(
                designSystem.colors.secondary,
                designSystem.typography.small,
                "hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              )}>
                Help Center
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoleSelection;

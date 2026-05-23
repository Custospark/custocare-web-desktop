import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Heart, TrendingUp } from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';

interface LandingStatsProps {
  theme: string;
}

export const LandingStats: React.FC<LandingStatsProps> = ({ theme }) => {
  const stats = [
    {
      value: "Unified",
      label: "Patient Records",
      sublabel: "Across visits & facilities",
      icon: Users,
      color: "blue",
      description: "Centralized patient records supporting continuity of care across departments and facilities"
    },
    {
      value: "Real-Time",
      label: "Operational Visibility",
      sublabel: "Facility-wide insights",
      icon: Activity,
      color: "emerald",
      description: "Live visibility into care delivery, queues, and operational workflows"
    },
    {
      value: "Audit-Ready",
      label: "System Design",
      sublabel: "Compliance-first",
      icon: Heart,
      color: "purple",
      description: "Built-in audit trails, access control, and traceability across all workflows"
    },
    {
      value: "Scalable",
      label: "Healthcare Operations",
      sublabel: "Clinic to national level",
      icon: TrendingUp,
      color: "orange",
      description: "Designed to scale from single facilities to regional and national health systems"
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.7 }}
      className={cn(
        "mt-12 sm:mt-16 lg:mt-24 p-6 sm:p-8 lg:p-12 rounded-3xl border-2 backdrop-blur-sm",
        theme === 'dark'
          ? "bg-slate-800/40 border-slate-700/60 shadow-2xl shadow-slate-900/30"
          : "bg-white/70 border-slate-200/60 shadow-2xl shadow-slate-200/50"
      )}
      aria-label="Platform statistics"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.12, type: "spring", stiffness: 100 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="text-center group cursor-pointer"
            role="figure"
            aria-label={stat.description}
            title={stat.description}
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.15 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className={cn(
                "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-xl",
                stat.color === 'blue' && "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/40",
                stat.color === 'emerald' && "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/40",
                stat.color === 'purple' && "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/40",
                stat.color === 'orange' && "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/40"
              )}
              aria-hidden="true"
            >
              <stat.icon className="w-7 h-7 text-white drop-shadow-md" />
            </motion.div>
            <motion.div
              className={cn(
                "text-3xl sm:text-1xl lg:text-2xl font-extrabold mb-2 tracking-tight group-hover:scale-110 transition-transform",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}
            >
              {stat.value}
            </motion.div>
            <div className={cn(
              "text-sm font-bold mb-1 tracking-tight",
              theme === 'dark' ? "text-slate-300" : "text-slate-700"
            )}>
              {stat.label}
            </div>
            <div className={cn(
              "text-xs font-medium",
              theme === 'dark' ? "text-slate-500" : "text-slate-500"
            )}>
              {stat.sublabel}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

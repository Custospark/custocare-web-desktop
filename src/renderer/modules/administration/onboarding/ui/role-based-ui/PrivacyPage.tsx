import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { cn } from '../../../../../shared/types/cn';
import { LandingLayout } from './LandingLayout';

export const PrivacyPage: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);

  return (
    <LandingLayout>
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={cn(
            "text-4xl sm:text-5xl font-extrabold tracking-tight mb-4",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            Privacy & Security
          </h1>
          <p className={cn(
            "text-lg max-w-2xl mx-auto",
            theme === 'dark' ? "text-slate-300" : "text-slate-600"
          )}>
            Your healthcare data is protected with enterprise-grade security and compliance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Shield, title: 'Data Protection', desc: 'All data encrypted at rest and in transit using 256-bit encryption. HIPAA-compliant infrastructure.' },
            { icon: Lock, title: 'Access Control', desc: 'Role-based access control ensures only authorized personnel can access patient information.' },
            { icon: Eye, title: 'Audit Trail', desc: 'Every access and modification is logged. Full traceability for compliance and security reviews.' },
            { icon: FileText, title: 'Data Residency', desc: 'Choose where your data is stored. Compliance with local data protection regulations.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "rounded-xl border-2 p-6",
                theme === 'dark' ? "bg-slate-800/40 border-slate-700/60" : "bg-white/80 border-slate-200"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className={cn("font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>
                {item.title}
              </h3>
              <p className={cn("text-sm", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "rounded-xl border-2 p-8 prose prose-sm max-w-none",
            theme === 'dark' ? "bg-slate-800/40 border-slate-700/60 text-slate-300" : "bg-white/80 border-slate-200 text-slate-700"
          )}
        >
          <p className={cn("text-sm mb-4", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
            Last updated: May 2026
          </p>
          <p className="mb-4">
            This privacy policy document is under preparation. Custocare is committed to protecting the privacy
            and security of healthcare data in accordance with applicable data protection laws and regulations.
          </p>
          <p>
            For any questions regarding data privacy and security, please contact{' '}
            <a href="mailto:support@custospark.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@custospark.com
            </a>.
          </p>
        </motion.div>
      </div>
    </LandingLayout>
  );
};

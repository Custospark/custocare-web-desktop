import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Eye, FileText, Server, KeyRound,
  UserCheck, Database, Download, Building2, ScrollText,
  Globe, Clock, CheckCircle2,
} from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { cn } from '../../../../../shared/types/cn';
import { LandingLayout } from './LandingLayout';

const sections = [
  {
    title: 'Data Protection & Encryption',
    icon: Shield,
    items: [
      'All data encrypted at rest using AES-256 encryption',
      'All data encrypted in transit using TLS 1.3',
      'End-to-end encryption for clinical communication (messaging)',
      'Encryption keys managed through secure key management infrastructure',
      'Field-level encryption for sensitive patient identifiers (names, contact info, MRNs)',
    ],
  },
  {
    title: 'Access Control & Authentication',
    icon: KeyRound,
    items: [
      'Role-based access control (RBAC) — every user gets precisely the permissions they need',
      'Multi-factor authentication (MFA) via Google Authenticator for all accounts',
      'Session management with automatic timeout on inactivity',
      'IP-based access restrictions available for facility accounts',
      'Single sign-on (SSO) support for enterprise deployments',
    ],
  },
  {
    title: 'Audit Trail & Accountability',
    icon: Eye,
    items: [
      'Every access, modification, and deletion is logged with timestamp and user identity',
      'Immutable audit logs — no user can alter or delete their activity trail',
      'Visit-level audit showing exactly which staff accessed each patient record and when',
      'Billing audit trail covering every charge, adjustment, and refund',
      'Exportable audit reports for internal review or regulatory submission',
    ],
  },
  {
    title: 'Patient Data Rights & Consent',
    icon: UserCheck,
    items: [
      'Patients control who can access their records through explicit consent management',
      'Granular consent types — treatment, billing, research, and emergency access',
      'Patients can revoke consent at any time; access is restricted immediately',
      'Patient portal provides full access to their own medical history, results, and billing',
      'Data portability — patients can download their complete health record at any time',
    ],
  },
  {
    title: 'Data Residency & Storage',
    icon: Database,
    items: [
      'Choose your data region — data is stored in the region you select',
      'Primary infrastructure on AWS/Azure with regional data centers',
      'Data never leaves your chosen jurisdiction without explicit authorization',
      'Backups encrypted and stored in the same region with geo-redundancy',
      'Regular disaster recovery testing with documented RTO and RPO',
    ],
  },
  {
    title: 'Compliance & Certifications',
    icon: ScrollText,
    items: [
      'Architecture designed to meet HIPAA compliance requirements',
      'SOC 2 Type II audit-ready controls and reporting',
      'ISO 27001-aligned information security management system',
      'GDPR-ready data processing controls for European operations',
      'Local data protection law compliance (Uganda DPPA, Kenya DPA, Nigeria NDPR)',
    ],
  },
  {
    title: 'Business Continuity & Data Retention',
    icon: Clock,
    items: [
      'Automated daily backups with 30-day retention for operational recovery',
      'Monthly backups archived for 7-year compliance retention',
      'Point-in-time recovery capability for rapid restoration',
      '99.9% uptime SLA for enterprise accounts',
      'Disaster recovery plan tested quarterly',
    ],
  },
  {
    title: 'Data Export & Platform Exit',
    icon: Download,
    items: [
      'Full data export at any time — no lock-in, no data hostage',
      'Export formats include JSON, CSV, and PDF for portability',
      'Structured export includes all patient records, billing data, and clinical documentation',
      'Transition assistance available for enterprise accounts',
      'Permanent data deletion within 90 days of account closure, with confirmation',
    ],
  },
  {
    title: 'Infrastructure & Physical Security',
    icon: Server,
    items: [
      'Cloud infrastructure hosted on SOC 2-compliant providers',
      'Network segmentation, firewalls, and intrusion detection systems',
      'All access to production environments requires VPN + MFA',
      'Regular penetration testing and vulnerability assessments',
      'No Custocare employee can view patient data without explicit authorized access logging',
    ],
  },
  {
    title: 'Business Associate Agreement (BAA)',
    icon: FileText,
    items: [
      'We execute Business Associate Agreements with all healthcare facility customers',
      'BAA covers all protected health information (PHI) processed on the platform',
      'BAA defines our duties, breach notification obligations, and data handling requirements',
      'BAA available for review and signature during onboarding',
      'Subprocessors listed in the BAA with notification of any changes',
    ],
  },
];

const faqItems = [
  {
    q: 'Who owns the data entered into Custocare?',
    a: 'The healthcare facility owns all data. Custocare is a data processor — we store and process data on behalf of the facility. We never access, use, or share patient data except as directed by the facility and as necessary to provide the service.',
  },
  {
    q: 'Do you share patient data with third parties?',
    a: 'No. We do not sell patient data. We do not share patient data with third parties except: (1) as directed by the facility, (2) as required by law, or (3) with subprocessors essential to service delivery (cloud infrastructure, email delivery) who are contractually bound to the same standards.',
  },
  {
    q: 'What happens if Custocare goes out of business?',
    a: 'Customers retain the ability to export all data at any time. In the event of business closure, we commit to a 90-day wind-down period during which all facilities can export their complete data. After that, all customer data is permanently and securely deleted.',
  },
  {
    q: 'How do you handle breach notification?',
    a: 'Custocare will notify affected facilities within 72 hours of confirming a breach involving PHI. Notification includes the nature of the breach, data involved, remediation steps, and contact information for follow-up. This is contractually obligated in the BAA.',
  },
  {
    q: 'Can we host Custocare on our own infrastructure?',
    a: 'Custocare is a SaaS platform running on our managed cloud infrastructure. For enterprise customers with specific requirements, private cloud deployment and dedicated instance options are available. Contact our sales team to discuss.',
  },
  {
    q: 'How is patient consent managed?',
    a: 'Custocare includes a built-in consent management system. Patients can grant and revoke consent for treatment, billing, and research purposes. Staff can see real-time consent status before accessing records. All consent changes are logged in the audit trail.',
  },
];

export const PrivacyPage: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);

  return (
    <LandingLayout>
      <div className="w-full max-w-5xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <span className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border mb-5",
            theme === 'dark'
              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
              : "bg-blue-50 border-blue-200 text-blue-700"
          )}>
            <Shield className="w-3.5 h-3.5" />
            Privacy & Security
          </span>
          <h1 className={cn(
            "text-4xl sm:text-5xl font-extrabold tracking-tight mb-4",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            Your Data. Your Control.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              Our Commitment.
            </span>
          </h1>
          <p className={cn(
            "text-lg max-w-3xl mx-auto",
            theme === 'dark' ? "text-slate-300" : "text-slate-600"
          )}>
            We built Custocare on the principle that healthcare data belongs to the patient and the facility — never to us.
            Every architectural decision, every policy, and every line of code reflects that commitment.
          </p>
        </motion.div>

        {/* Principles bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl border-2 p-6 mb-14 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center",
            theme === 'dark' ? "bg-slate-800/40 border-slate-700/60" : "bg-white/80 border-slate-200"
          )}
        >
          {[
            { icon: Lock, title: 'Encrypted by Default', desc: 'AES-256 at rest, TLS 1.3 in transit' },
            { icon: Eye, title: 'Full Audit Trail', desc: 'Every access logged. Nothing hidden.' },
            { icon: Globe, title: 'Your Data Stays Local', desc: 'Choose your data region. Data never leaves.' },
          ].map((item) => (
            <div key={item.title}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className={cn("font-bold text-sm mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                {item.title}
              </h3>
              <p className={cn("text-xs", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Content sections */}
        <div className="space-y-6 mb-14">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={cn(
                "rounded-2xl border-2 p-6 sm:p-8",
                theme === 'dark' ? "bg-slate-800/40 border-slate-700/60" : "bg-white/80 border-slate-200"
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={cn(
                    "text-lg font-bold",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}>
                    {section.title}
                  </h2>
                </div>
              </div>
              <ul className="space-y-2 ml-1">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className={cn(
                      "text-sm",
                      theme === 'dark' ? "text-slate-300" : "text-slate-700"
                    )}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* BAA CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn(
            "rounded-2xl border-2 p-8 mb-14 text-center",
            theme === 'dark'
              ? "bg-gradient-to-br from-blue-900/20 via-slate-800/40 to-emerald-900/20 border-blue-500/30"
              : "bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-blue-200"
          )}
        >
          <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className={cn(
            "text-2xl font-bold mb-3",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            Need a Business Associate Agreement?
          </h2>
          <p className={cn(
            "text-sm max-w-2xl mx-auto mb-6",
            theme === 'dark' ? "text-slate-300" : "text-slate-600"
          )}>
            We execute BAAs with all healthcare facility customers. The BAA covers our obligations
            around PHI handling, breach notification, subprocessors, and data protection. Available
            during onboarding or on request.
          </p>
          <a
            href="mailto:support@custospark.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            Request BAA
            <FileText className="w-4 h-4" />
          </a>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className={cn(
            "text-2xl font-bold mb-8 text-center",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className={cn(
                  "rounded-xl border-2 p-5",
                  theme === 'dark' ? "bg-slate-800/40 border-slate-700/60" : "bg-white/80 border-slate-200"
                )}
              >
                <h3 className={cn(
                  "font-bold mb-1.5",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {item.q}
                </h3>
                <p className={cn(
                  "text-sm leading-relaxed",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className={cn(
            "text-center text-xs pb-8",
            theme === 'dark' ? "text-slate-500" : "text-slate-500"
          )}
        >
          <p className="mb-1">Last updated: May 2026</p>
          <p>
            Questions about data privacy? Contact{' '}
            <a href="mailto:support@custospark.com" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              support@custospark.com
            </a>
          </p>
        </motion.div>
      </div>
    </LandingLayout>
  );
};

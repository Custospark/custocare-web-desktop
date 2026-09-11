import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, CheckCircle2 } from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { cn } from '../../../../../shared/types/cn';

interface NoticeItem {
  key: string;
  title: string;
  body: string;
}

interface PrivacyNotice {
  version: string;
  effective_at: string;
  controller: { name: string; contact: string };
  dpo_contact: string;
  complaints_contact: string;
  items: NoticeItem[];
}

/**
 * Live privacy notice (Act 2019 Sec 13, 9 mandatory items) served by
 * GET /api/compliance/privacy-notice. Versioned: any backend content change
 * obliges fresh consent, and this section always shows the current text.
 * Fails silent when the API is unreachable so the marketing page never breaks.
 */
export const PrivacyNoticeSection: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const [notice, setNotice] = useState<PrivacyNotice | null>(null);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get<{ data: PrivacyNotice }>('/compliance/privacy-notice')
      .then((res) => {
        if (!cancelled && res.data?.data?.items?.length) setNotice(res.data.data);
      })
      .catch(() => {
        /* offline / backend down - section stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!notice) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border-2 p-6 sm:p-8 mb-6',
        theme === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200',
      )}
    >
      <div className="flex items-start gap-4 mb-2">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-md">
          <ScrollText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className={cn('text-lg font-bold', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
            Privacy Notice
          </h2>
          <p className={cn('text-xs', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
            Version {notice.version} · Effective {notice.effective_at} · {notice.controller.name} ({notice.controller.contact}) · DPO: {notice.dpo_contact}
          </p>
        </div>
      </div>
      <ul className="space-y-3 ml-1 mt-4">
        {notice.items.map((item) => (
          <li key={item.key} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span className={cn('text-sm', theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}>
              <strong>{item.title}.</strong> {item.body}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default PrivacyNoticeSection;

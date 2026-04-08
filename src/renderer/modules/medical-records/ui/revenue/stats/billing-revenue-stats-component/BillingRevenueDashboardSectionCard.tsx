import React from 'react';
import { cx } from '../../billing-review/utils';

type BillingRevenueDashboardSectionCardProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  cardClassName: string;
  headerClassName?: string;
  isDark: boolean;
  text: string;
  textSecondary: string;
};

const BillingRevenueDashboardSectionCard: React.FC<
  BillingRevenueDashboardSectionCardProps
> = ({
  title,
  subtitle,
  icon,
  right,
  children,
  cardClassName,
  headerClassName,
  isDark,
  text,
  textSecondary,
}) => {
  return (
    <section className={cardClassName}>
      <header className={cx('flex items-start gap-3 mb-4', headerClassName)}>
        {icon ? (
          <div
            className={cx(
              'mt-0.5 p-2 rounded-lg border',
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            )}
          >
            {icon}
          </div>
        ) : null}

        <div className="min-w-0">
          <h2 className={cx('text-base sm:text-lg font-semibold leading-tight', text)}>
            {title}
          </h2>

          {subtitle ? (
            <p className={cx('text-sm mt-1', textSecondary)}>{subtitle}</p>
          ) : null}
        </div>

        {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
      </header>

      {children}
    </section>
  );
};

export default BillingRevenueDashboardSectionCard;

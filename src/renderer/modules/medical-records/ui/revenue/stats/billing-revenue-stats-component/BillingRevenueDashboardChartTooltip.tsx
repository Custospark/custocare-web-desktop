import React from 'react';
import { Tooltip } from 'recharts';

type BillingRevenueDashboardChartTooltipProps = {
  isDark: boolean;
  bg: string;
  border: string;
  text: string;
};

const BillingRevenueDashboardChartTooltip: React.FC<
  BillingRevenueDashboardChartTooltipProps
> = ({ isDark, bg, border, text }) => {
  return (
    <Tooltip
      contentStyle={{
        backgroundColor: bg,
        borderColor: border,
        color: text,
        borderRadius: 10,
        boxShadow: isDark
          ? '0 12px 28px rgba(0,0,0,0.5)'
          : '0 12px 28px rgba(0,0,0,0.12)',
      }}
      itemStyle={{ color: text }}
      labelStyle={{ color: text, fontWeight: 600 }}
      cursor={{
        fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)',
      }}
    />
  );
};

export default BillingRevenueDashboardChartTooltip;

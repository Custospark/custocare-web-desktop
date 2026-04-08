import React from 'react';
import { Tooltip } from 'recharts';
import { formatText } from './revenueDashboardUtils'; // Adjust import path as needed

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
      formatter={(value: any, name: any) => {
        // Format the category name if it's a string
        const formattedName = typeof name === 'string' ? formatText(name) : name;
        return [value, formattedName];
      }}
      labelFormatter={(label: any) => {
        // Format the label (usually the category name)
        return typeof label === 'string' ? formatText(label) : label;
      }}
      cursor={{
        fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)',
      }}
    />
  );
};

export default BillingRevenueDashboardChartTooltip;
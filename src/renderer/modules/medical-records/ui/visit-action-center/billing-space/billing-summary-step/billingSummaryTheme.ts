export const getBillingSummaryColors = (isDark: boolean) => ({
  bg: {
    primary: isDark ? 'bg-gray-900' : 'bg-white',
    secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
    elevated: isDark ? 'bg-gray-900' : 'bg-white',
    hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
    receipt: 'bg-white',
    disabled: isDark ? 'bg-gray-800/50' : 'bg-gray-100',
  },
  border: {
    primary: isDark ? 'border-gray-800' : 'border-gray-200',
    receipt: 'border-gray-300',
    disabled: isDark ? 'border-gray-700' : 'border-gray-200',
  },
  text: {
    primary: isDark ? 'text-gray-100' : 'text-gray-900',
    secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    disabled: isDark ? 'text-gray-500' : 'text-gray-400',
  },
  accent: {
    primary: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-white',
    ring: 'focus:ring-blue-500',
  },
  select: {
    wrap: isDark ? 'bg-gray-950/40' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-300',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    option: isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
    disabled: isDark ? 'text-gray-500' : 'text-gray-400',
  },
  status: {
    draft: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
    ready: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
    settled: 'bg-green-600 text-white dark:bg-green-500 dark:text-white',
  },
});

export type BillingSummaryColors = ReturnType<typeof getBillingSummaryColors>;

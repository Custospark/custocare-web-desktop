/* ─────────────────── styling helpers ─────────────────────────────────── */

export const inputBase = (isDark: boolean, extra = '') =>
  `w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm border outline-none transition-colors focus:ring-2 ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
  } ${extra}`.trim();

export const selectBase = (isDark: boolean) => inputBase(isDark, 'cursor-pointer appearance-none');
export const getRoleDisplayName = (roleCode?: string | null): string => {
      if (!roleCode) return '—';

      return roleCode
        .replace(/[_-]+/g, ' ')
        .toUpperCase();
    };
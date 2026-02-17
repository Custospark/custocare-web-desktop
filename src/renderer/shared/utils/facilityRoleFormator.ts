export const getRoleDisplayName = (roleCode?: string | null): string => {
      if (!roleCode) return '—';

      return roleCode
        .replace(/[_-]+/g, ' ')
        .toUpperCase();
    };

    export const capitalizeFirstLetters = (str?: string | null): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
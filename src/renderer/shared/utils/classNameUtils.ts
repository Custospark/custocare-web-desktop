/**
 * Utility function to merge class names
 * Similar to 'classnames' or 'clsx' packages
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes
    .filter((cls) => typeof cls === 'string' && cls.trim().length > 0)
    .join(' ');
};

/**
 * Conditional class names
 */
export const conditionalClass = (
  baseClass: string,
  condition: boolean,
  conditionalClass: string
): string => {
  return condition ? `${baseClass} ${conditionalClass}` : baseClass;
};
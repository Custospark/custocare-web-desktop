import { cn } from "../types/cn";

// components/ui/BrandName.tsx
import React from 'react';

export const BrandName: React.FC<{ className?: string }> = ({ className }) => (
  <span className={cn(
    'font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent uppercase',
    'text-[length:inherit]', // Inherits font size from parent!
    className
  )}>
    CUSTOCARE
  </span>
);
export const BRAND_NAME_UCASE = 'CUSTOCARE';
export const BRAND_NAME_LCASE = 'Custocare';
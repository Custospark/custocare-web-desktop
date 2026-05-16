// shared/components/Feedback/ConfirmDialog/ConfirmProvider.tsx
import React, { useCallback, useState } from 'react';
import { ConfirmContext, type ConfirmOptions } from './ConfirmContext';
import { ConfirmDialog } from './ConfirmDialog';

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean | 'extra') => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean | 'extra'> => {
    setOptions(opts);
    return new Promise<boolean | 'extra'>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => { resolver?.(true); cleanup(); };
  const handleCancel = () => { resolver?.(false); cleanup(); };
  const handleExtra = () => { resolver?.('extra'); cleanup(); };

  const cleanup = () => { setOptions(null); setResolver(null); };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={!!options}
        options={options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onExtra={handleExtra}
        theme={options?.theme || 'light'}
      />
    </ConfirmContext.Provider>
  );
};

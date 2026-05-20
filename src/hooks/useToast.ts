import { useCallback, useContext } from 'react';
import { ToastContext } from '@/providers/ToastProvider';

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    console.warn('useToast must be used within ToastProvider');
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }

  const { addToast } = context;

  const success = useCallback(
    (message: string, duration = 3000) => {
      addToast(message, 'success', duration);
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, duration = 5000) => {
      addToast(message, 'error', duration);
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, duration = 3000) => {
      addToast(message, 'info', duration);
    },
    [addToast]
  );

  return { success, error, info };
}

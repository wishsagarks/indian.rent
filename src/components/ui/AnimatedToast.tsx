'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface AnimatedToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const icons = {
  success: <Check size={18} className="text-emerald-400" />,
  error: <AlertCircle size={18} className="text-red-400" />,
  info: <Info size={18} className="text-blue-400" />,
};

const bgColors = {
  success: 'bg-emerald-400/10 border-emerald-400/30',
  error: 'bg-red-400/10 border-red-400/30',
  info: 'bg-blue-400/10 border-blue-400/30',
};

export default function AnimatedToast({ toasts, onDismiss }: AnimatedToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, idx) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            index={idx}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({
  toast,
  onDismiss,
  index,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!toast.duration) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        duration: 0.3,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm transition-all ${bgColors[toast.type]}`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-medium text-on-surface flex-1">{toast.message}</p>
      <motion.button
        onClick={() => onDismiss(toast.id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="flex-shrink-0 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <X size={16} />
      </motion.button>
    </motion.div>
  );
}

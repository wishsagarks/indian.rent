'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  icon?: React.ReactNode;
}

export default function AnimatedFormInput({
  label,
  helperText,
  error = false,
  errorMessage,
  icon,
  className = '',
  ...props
}: AnimatedFormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <motion.label
          animate={{
            y: isFocused ? -4 : 0,
            color: isFocused ? '#0066ff' : 'currentColor'
          }}
          transition={{ duration: 0.15 }}
          className="text-sm font-bold text-on-surface block"
        >
          {label}
        </motion.label>
      )}

      <motion.div
        animate={{
          boxShadow: isFocused
            ? '0 0 20px rgba(0, 102, 255, 0.3), inset 0 0 0 2px rgba(0, 102, 255, 0.2)'
            : '0 0 0px rgba(0, 102, 255, 0)'
        }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
            {icon}
          </div>
        )}

        <input
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`w-full bg-surface-container-low border border-white/5 rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/30 font-bold focus:border-primary outline-none transition-colors ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-white/5 focus:border-primary'
          } ${className}`}
          {...props}
        />
      </motion.div>

      {error && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 flex items-center gap-1"
        >
          <span>⚠️</span> {errorMessage}
        </motion.div>
      )}

      {helperText && !error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-on-surface-variant/60"
        >
          {helperText}
        </motion.p>
      )}
    </div>
  );
}

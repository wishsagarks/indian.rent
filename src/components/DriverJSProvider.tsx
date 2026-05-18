'use client';

import { useEffect } from 'react';

export function DriverJSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if driver.js is enabled
    const isEnabled = process.env.NEXT_PUBLIC_DRIVER_JS_ENABLED === 'true';
    if (!isEnabled) return;

    // Optionally, you can initialize driver.js here globally
    // This component serves as the provider wrapper for driver.js functionality
  }, []);

  return <>{children}</>;
}

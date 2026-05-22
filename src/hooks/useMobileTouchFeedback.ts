import { useRef, useCallback } from 'react';

interface TouchFeedbackConfig {
  scalePress?: number;
  scaleLift?: number;
  duration?: number;
}

export function useMobileTouchFeedback(config: TouchFeedbackConfig = {}) {
  const {
    scalePress = 0.95,
    scaleLift = 1,
    duration = 0.15
  } = config;

  const elementRef = useRef<HTMLElement>(null);
  const isPressingRef = useRef(false);

  const handleTouchStart = useCallback(() => {
    if (!elementRef.current) return;
    isPressingRef.current = true;

    // Add tactile feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    elementRef.current.style.transform = `scale(${scalePress})`;
    elementRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }, [scalePress, duration]);

  const handleTouchEnd = useCallback(() => {
    if (!elementRef.current) return;
    isPressingRef.current = false;

    elementRef.current.style.transform = `scale(${scaleLift})`;
  }, [scaleLift]);

  return { elementRef, handleTouchStart, handleTouchEnd };
}

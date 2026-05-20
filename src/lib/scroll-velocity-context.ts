import { createContext, useContext } from 'react';

export interface ScrollVelocityContextType {
  velocity: number; // pixels per millisecond
  isFastScroll: boolean; // velocity > 0.8
  isSlowScroll: boolean; // velocity < 0.2
  shouldReduceComplexity: boolean; // true on mobile + fast scroll
}

export const ScrollVelocityContext = createContext<ScrollVelocityContextType>({
  velocity: 0,
  isFastScroll: false,
  isSlowScroll: true,
  shouldReduceComplexity: false,
});

export function useScrollVelocity() {
  const context = useContext(ScrollVelocityContext);
  if (!context) {
    console.warn('useScrollVelocity must be used within SmoothScroll');
    return {
      velocity: 0,
      isFastScroll: false,
      isSlowScroll: true,
      shouldReduceComplexity: false,
    };
  }
  return context;
}

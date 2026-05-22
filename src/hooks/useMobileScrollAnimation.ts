import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface MobileScrollAnimationConfig {
  trigger?: string;
  start?: string;
  end?: string;
  duration?: number;
  stagger?: number;
  isMobile?: boolean;
  onlyMobile?: boolean;
}

export function useMobileScrollAnimation(
  selector: string,
  config: MobileScrollAnimationConfig = {}
) {
  const {
    trigger = selector,
    start = 'top 75%',
    end,
    duration = 0.6,
    stagger = 0.15,
    isMobile = typeof window !== 'undefined' && window.innerWidth < 768,
    onlyMobile = false
  } = config;

  const contextRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    // Skip if animation shouldn't run on this device
    if (onlyMobile && !isMobile) return;

    // Skip if reduced motion is preferred
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(selector, {
        opacity: 0,
        y: isMobile ? 30 : 50,
        scale: 0.9,
        stagger,
        duration,
        ease: 'back.out',
        scrollTrigger: {
          trigger,
          start,
          end,
          onEnter: () => {}
        }
      });
    });

    contextRef.current = ctx;

    return () => {
      ctx.revert();
    };
  }, [selector, trigger, start, end, duration, stagger, isMobile, onlyMobile]);
}

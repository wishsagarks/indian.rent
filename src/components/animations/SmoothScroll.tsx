'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollVelocityContext, ScrollVelocityContextType } from '@/lib/scroll-velocity-context';

gsap.registerPlugin(ScrollTrigger);

function ScrollTriggerProxy({ children }: { children: ReactNode }) {
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const velocityRef = useRef(0);
  const prevVelocityRef = useRef(0);
  const [velocityState, setVelocityState] = useState<ScrollVelocityContextType>({
    velocity: 0,
    isFastScroll: false,
    isSlowScroll: true,
    shouldReduceComplexity: false,
  });
  const isMobileRef = useRef(typeof window !== 'undefined' && window.innerWidth < 768);

  // Get Lenis instance directly — returns null until ReactLenis mounts
  const lenisInstance = useLenis();

  // Register ticker callback once instance is available
  useEffect(() => {
    if (!lenisInstance) return;

    const update = () => ScrollTrigger.update();
    const tickerFn = (time: number) => lenisInstance.raf(time * 1000);

    lenisInstance.on('scroll', update);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    // Set up ScrollTrigger proxy for proper scroll detection
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value?: number) {
        if (arguments.length && value !== undefined) {
          lenisInstance.scrollTo(value, { immediate: true });
        }
        return lenisInstance.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });

    return () => {
      lenisInstance.off('scroll', update);
      gsap.ticker.remove(tickerFn);
      ScrollTrigger.scrollerProxy(null);
    };
  }, [lenisInstance]); // Re-run when instance becomes available

  // Track scroll velocity and nav hide behavior
  useEffect(() => {
    if (!lenisInstance) return;

    const handleScroll = ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      const now = Date.now();
      const deltaTime = now - lastScrollTime.current;

      const deltaScroll = Math.abs(scroll - lastScrollY.current);
      const pixelsPerMs = deltaTime > 0 ? deltaScroll / deltaTime : 0;

      const smoothedVelocity = pixelsPerMs * 0.7 + (prevVelocityRef.current * 0.3);
      const isFastScroll = smoothedVelocity > 0.8;
      const isSlowScroll = smoothedVelocity < 0.2;

      prevVelocityRef.current = smoothedVelocity;

      setVelocityState({
        velocity: smoothedVelocity,
        isFastScroll,
        isSlowScroll,
        shouldReduceComplexity: isMobileRef.current && isFastScroll,
      });

      const isScrollingDown = scroll > lastScrollY.current && scroll > 80;
      const nav = document.querySelector('nav');
      if (nav) {
        nav.classList.toggle('nav-hidden', isScrollingDown);
      }

      lastScrollY.current = scroll;
      lastScrollTime.current = now;
    };

    lenisInstance.on('scroll', handleScroll);
    return () => lenisInstance.off('scroll', handleScroll);
  }, [lenisInstance]);

  return (
    <ScrollVelocityContext.Provider value={velocityState}>
      {children}
    </ScrollVelocityContext.Provider>
  );
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.18, duration: 0.6, syncTouch: true, wheelMultiplier: 1.2, autoRaf: false }}>
      <ScrollTriggerProxy>
        {children}
      </ScrollTriggerProxy>
    </ReactLenis>
  );
}

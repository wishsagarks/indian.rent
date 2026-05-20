'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollVelocityContext, ScrollVelocityContextType } from '@/lib/scroll-velocity-context';

gsap.registerPlugin(ScrollTrigger);

function ScrollTriggerProxy({ children }: { children: ReactNode }) {
  const lenisRef = useRef<any>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const velocityRef = useRef(0);
  const [velocityState, setVelocityState] = useState<ScrollVelocityContextType>({
    velocity: 0,
    isFastScroll: false,
    isSlowScroll: true,
    shouldReduceComplexity: false,
  });
  const isMobileRef = useRef(typeof window !== 'undefined' && window.innerWidth < 768);

  useLenis((lenis) => {
    lenisRef.current = lenis;
  });

  useEffect(() => {
    if (!lenisRef.current) return;

    const lenis = lenisRef.current;
    const update = () => ScrollTrigger.update();
    const tickerFn = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', update);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', update);
      gsap.ticker.remove(tickerFn);
    };
  }, []);

  // Track scroll velocity and hide nav on scroll down
  useEffect(() => {
    if (!lenisRef.current) return;

    const handleScroll = ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      const now = Date.now();
      const deltaTime = now - lastScrollTime.current;

      // Calculate velocity in pixels per millisecond
      const deltaScroll = Math.abs(scroll - lastScrollY.current);
      const pixelsPerMs = deltaTime > 0 ? deltaScroll / deltaTime : 0;

      // Smooth velocity using exponential moving average
      const smoothedVelocity = pixelsPerMs * 0.7 + (velocityRef.current * 0.3);
      const isFastScroll = smoothedVelocity > 0.8; // fast scroll threshold
      const isSlowScroll = smoothedVelocity < 0.2; // slow scroll threshold

      velocityRef.current = smoothedVelocity;

      setVelocityState({
        velocity: smoothedVelocity,
        isFastScroll,
        isSlowScroll,
        shouldReduceComplexity: isMobileRef.current && isFastScroll,
      });

      // Hide nav on scroll down
      const isScrollingDown = scroll > lastScrollY.current && scroll > 80;
      const nav = document.querySelector('nav');
      if (nav) {
        nav.classList.toggle('nav-hidden', isScrollingDown);
      }

      lastScrollY.current = scroll;
      lastScrollTime.current = now;
    };

    lenisRef.current.on('scroll', handleScroll);
    return () => lenisRef.current?.off('scroll', handleScroll);
  }, []);

  return (
    <ScrollVelocityContext.Provider value={velocityState}>
      {children}
    </ScrollVelocityContext.Provider>
  );
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.18, duration: 0.6, syncTouch: true, wheelMultiplier: 1.2 }}>
      <ScrollTriggerProxy>
        {children}
      </ScrollTriggerProxy>
    </ReactLenis>
  );
}

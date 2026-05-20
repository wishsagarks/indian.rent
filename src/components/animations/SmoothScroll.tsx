'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function ScrollTriggerProxy({ children }: { children: ReactNode }) {
  const lenisRef = useRef<any>(null);

  useLenis((lenis) => {
    lenisRef.current = lenis;
  });

  useEffect(() => {
    if (!lenisRef.current) return;

    // Proxy scroll to GSAP ScrollTrigger
    const update = () => ScrollTrigger.update();
    const lenis = lenisRef.current;

    lenis.on('scroll', update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', update);
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  // Hide nav on scroll down
  const navRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!lenisRef.current) return;

    const handleScroll = ({ scroll }: { scroll: number }) => {
      const isScrollingDown = scroll > lastScrollY.current && scroll > 80;
      const nav = document.querySelector('nav');
      if (nav) {
        nav.classList.toggle('nav-hidden', isScrollingDown);
      }
      lastScrollY.current = scroll;
    };

    lenisRef.current.on('scroll', handleScroll);
    return () => lenisRef.current?.off('scroll', handleScroll);
  }, []);

  return <>{children}</>;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.0, syncTouch: true }}>
      <ScrollTriggerProxy>
        {children}
      </ScrollTriggerProxy>
    </ReactLenis>
  );
}

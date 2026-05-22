'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function HeroText() {
  const containerRef = useRef(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!textRef.current) return;

    const text = "Build Community. Bypass Brokers. Own Markets.";
    const words = text.split(' ');

    // Clear existing content
    textRef.current.innerHTML = '';

    // Safely build DOM structure without using innerHTML
    words.forEach(word => {
      const outerSpan = document.createElement('span');
      outerSpan.className = 'inline-block overflow-hidden pb-2';

      const innerSpan = document.createElement('span');
      innerSpan.className = 'inline-block translate-y-[110%]';
      innerSpan.textContent = `${word} `;

      outerSpan.appendChild(innerSpan);
      textRef.current!.appendChild(outerSpan);
    });

    gsap.to(textRef.current.querySelectorAll('span span'), {
      y: 0,
      stagger: 0.05,
      duration: 1.2,
      ease: 'power4.out',
      delay: 0.5
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="max-w-4xl text-left">
      <h1 ref={textRef} className="font-display text-5xl md:text-[80px] text-on-background font-extrabold tracking-[-0.04em] leading-[1.1] uppercase">
        Build Community. Bypass Brokers. Own Markets.
      </h1>
    </div>
  );
}

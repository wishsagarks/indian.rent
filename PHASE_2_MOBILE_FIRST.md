# Phase 2: Mobile-First Execution Strategy

**Status:** ✅ Tier 1 Complete ✅ Tier 2 Complete — Moving to Tier 3  
**Mobile Constraint:** <375px (Android phones), iOS variants (SE 375px, 14/15 390px)  
**Test Matrix:** iPhone SE / iPhone 14 / Pixel 6 / Galaxy S22  
**Success:** 60fps on low-end devices, touch targets ≥44px, animations unbroken on mobile  

---

## Tier 1: Icon & Visual Animations (Mobile-First)

### 1.1 Icon Life Cycles — Eye Blink Animation
**File:** `src/components/ui-advanced/BentoGrid.tsx`  
**Desktop:** Eye icon blink on scroll reveal (opens → closes → opens, 1.5s duration)  
**Mobile (≤375px):**
- Reduced particle effects (if any) to conserve battery
- Blink duration 1.0s (snappier on mobile, same 60fps)
- Scale slightly larger (18px → 20px on mobile) for touch visibility
- No parallax depth on mobile (single layer only)

**Responsive Spec:**
- Mobile (375px): eye-icon 20px, container padding 2px (not 4px)
- Tablet (768px): eye-icon 24px, container padding 4px
- Desktop (1024px+): eye-icon 28px, container padding 6px

**Touch-Safe:** Icon itself is 20px; hit area (parent button) is 44x44px min

---

### 1.2 Number Counters in Stats Section
**File:** `src/components/LandingPage.tsx` (stats section)  
**Desktop:** Animate 0→5K+ over 2s on scroll-into-view, comma formatting  
**Mobile (≤375px):**
- Counter duration 1.5s (faster animation, fits mobile scroll speed)
- Font size 28px → 24px on mobile (readability without overflow)
- Grid layout: 2 columns on mobile (supply/demand top, median/quality bottom)
- Remove decimal places on mobile (₹35k not ₹35.2k) to avoid crowding

**Responsive Spec:**
- Mobile: text-2xl (24px), grid-cols-2, gap-2
- Tablet: text-3xl (30px), grid-cols-2, gap-4
- Desktop: text-4xl (36px), grid-cols-4, gap-6

**Touch-Safe:** Stats are text-only, no touch targets (read-only)

---

### 1.3 Section Headline Reveals
**File:** `src/components/LandingPage.tsx` (anti-broker + final CTA)  
**Desktop:** Word-by-word reveal "The Anti-Broker Loop" (0.1s per word), letter cascade on final CTA  
**Mobile (≤375px):**
- Full-word cascade instead of letter-by-letter (fewer animation runs = less CPU)
- Duration: 0.08s per word (slightly faster for mobile)
- Line-height adjusted: 1.4 on mobile (vs 1.6 desktop) to prevent text breakage
- Font size: 28px → 20px on mobile to fit viewport

**Responsive Spec:**
- Mobile: text-xl (20px), leading-tight (1.25), stagger 80ms/word
- Tablet: text-3xl (30px), leading-normal (1.5), stagger 100ms/word
- Desktop: text-4xl (36px), leading-relaxed (1.6), stagger 120ms/word

**Performance:** Detect reduced-motion and skip all reveals (already implemented in Phase 1)

---

## Tier 1 Mobile Testing Checklist

**Devices to Test:**
- [ ] iPhone SE (375×667)
- [ ] iPhone 14 (390×844)
- [ ] iPhone 15 (393×852)
- [ ] Pixel 6 (412×915)
- [ ] Galaxy S22 (360×800)

**Per Device Validation:**
- [ ] Icons render at correct size (no cutoff)
- [ ] Counter animates smoothly without fps drops
- [ ] Text reveals don't cause line breaks mid-animation
- [ ] All hit areas ≥44×44px
- [ ] Animations smooth at 60fps (DevTools Performance tab)
- [ ] No layout shift (CLS = 0)
- [ ] Scroll behavior not jittery (Lenis smooth scroll intact)
- [ ] Touch-friendly spacing (no accidental taps)

**Fallback:** If animation causes <55fps on low-end device:
- Reduce stagger time by 10ms
- Reduce duration by 0.2s
- Disable parallax if present
- Use opacity instead of scale if needed

---

## Implementation Order (Tier 1)

**Session 1 (1.5h):** Icon Life Cycles + Number Counters
1. Add eye-icon blink variant (spring physics)
2. Create responsive icon size tokens
3. Implement AnimatedCounter with mobile stagger
4. Test on 3 mobile devices (SE, 14, Pixel 6)
5. Commit with mobile breakpoint CSS

**Session 2 (1.0h):** Section Headline Reveals
1. Wire "Anti-Broker Loop" word-by-word reveal
2. Add responsive font sizing (text-xl → text-3xl → text-4xl)
3. Implement cascade for final CTA
4. Test text layout on mobile (no mid-word breaks)
5. Commit with reduced-motion guard

**Session 3 (0.5h):** Mobile Optimization Pass
1. Profile animations on Galaxy S22 (mid-range)
2. Reduce stagger/duration if <60fps detected
3. Run Lighthouse audit on mobile
4. Final touch-target audit (44px min)

---

## Mobile-Specific Constraints

**Animation Budgets:**
- Mobile CPU: max 3 concurrent animations per frame
- Desktop CPU: max 5 concurrent animations

**Memory:**
- Low-end Android: reduce particle count by 50%, cap animation duration 1.5s max

**Network:**
- No extra assets on slow networks (prefers-reduced-data media query)

**Touch Events:**
- Debounce tap events 100ms to prevent double-tap zoom issues
- Keep scroll smooth (Lenis handled in Phase 1)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Mobile 60fps (Pixel 6) | ✅ 60 stable |
| Touch target size | ✅ ≥44×44px |
| CLS (layout shift) | ✅ <0.05 |
| Animation clarity | ✅ No jank/stutter |
| Accessibility (a11y) | ✅ WCAG AA (mobile) |
| Viewport fit | ✅ No overflow/scroll |

---

---

## Tier 2: Scroll Depth & Parallax (Mobile-First)

### 2.1 Parallax Text Depth
**File:** `src/components/LandingPage.tsx` (hero section)  
**Desktop:** Subheading moves 0.5x scroll speed, background blur increases, 3-layer depth  
**Mobile (≤375px):**
- Single-layer parallax (skip 3-layer depth effect for performance)
- Parallax scale factor: 0.2x (vs 0.5x desktop) to reduce CPU
- Background blur: 0-8px (vs 0-20px desktop) for mobile memory
- Subheading offset: 10px max (vs 30px desktop)

**Responsive Spec:**
- Mobile: parallax only on hero, skip elsewhere
- Tablet: light parallax on hero + stats
- Desktop: full 3-layer parallax everywhere

**Performance:** Detect motion preference; use Lenis scroll events to update parallax

---

### 2.2 Card Hover Physics (BentoGrid)
**File:** `src/components/ui-advanced/BentoGrid.tsx`  
**Desktop:** Cards lift 8px on hover, shadow follows light, 3D tilt (perspective)  
**Mobile (≤375px):**
- Lift reduced to 4px (vs 8px) to conserve GPU memory
- No 3D tilt on mobile (CSS perspective disabled)
- Shadow reduced: 0_4px_12px (vs 0_8px_24px)
- Use opacity change instead of lift for feedback

**Responsive Spec:**
- Mobile: hover → scale 1.02, shadow increase, no lift/tilt
- Tablet: hover → lift 4px, light 3D tilt
- Desktop: hover → lift 8px, full 3D tilt, dynamic shadow

**Touch-Safe:** On mobile, use active state (pressed) instead of hover for tactile feedback

---

### 2.3 Scroll Progress Indicator (TracingBeam)
**File:** `src/components/ui-advanced/TracingBeam.tsx`  
**Desktop:** Colorful gradient progress bar, percentage text, pulse at 25/50/75/100%  
**Mobile (≤375px):**
- Hide percentage text (keep visual bar only)
- Smaller checkpoint indicators: 8px (vs 12px desktop)
- Pulse effect removed on mobile (reduce animation count)
- Bar width: 2px (vs 4px desktop)

**Responsive Spec:**
- Mobile: simple progress line, no labels
- Tablet: line + small percentage (12px font)
- Desktop: line + large percentage (16px font) + pulse milestones

**Performance:** Use CSS-only animation for the progress bar (no JS)

---

## Implementation Order (Tier 2)

**Session 1 (1.5h):** Parallax Text Depth + Card Hover Physics
1. Implement hero parallax (0.2x mobile, 0.5x desktop)
2. Add hover effects to BentoGrid cards (mobile-friendly)
3. Test parallax on 3 devices (SE, Pixel 6, Galaxy S22)
4. Verify no jank during scroll + hover
5. Commit with responsive animations

**Session 2 (1.0h):** Scroll Progress Enhancement
1. Reduce TracingBeam complexity on mobile
2. Add optional percentage labels (hidden on <768px)
3. Pulse effect conditional on desktop
4. Test checkpoint alignment with sections
5. Commit with responsive indicators

**Session 3 (0.5h):** Tier 2 Mobile Optimization
1. Profile animations on mid-range device (Pixel 6)
2. Reduce parallax factor if scroll stutter detected
3. Profile card hover with multiple hovers in sequence
4. Run Lighthouse audit (mobile): target Performance >85
5. Final performance pass

---

## Tier 2 Mobile Testing Checklist

**Devices:**
- [ ] iPhone SE (375×667) — parallax smooth, no jank
- [ ] iPhone 14 (390×844) — hover feedback responsive
- [ ] Pixel 6 (412×915) — 60fps during parallax scroll
- [ ] Galaxy S22 (360×800) — card effects don't overload GPU

**Per Device Validation:**
- [ ] Parallax scale correct (0.2x mobile, 0.5x desktop)
- [ ] Card hover responsive on touch (active state visible)
- [ ] Progress bar alignment with sections (25/50/75/100%)
- [ ] No layout shift during animations (CLS = 0)
- [ ] Scroll smooth without fps drops
- [ ] All text readable (parallax doesn't blur text)
- [ ] Performance: Lighthouse >85 on mobile

**Fallback:** If animation causes <55fps:
- Reduce parallax scale by 50%
- Remove 3D perspective on cards
- Simplify progress bar animation
- Use CSS-only (no GSAP) for parallax

---

---

## Tier 3: Data Visualization & Depth (Mobile-First)

### 3.1 Analytics Chart Animations
**File:** `src/components/analytics/MetricsCharts.tsx`, `PriceDistributionChartEnhanced.tsx`, `MarketSegmentChartEnhanced.tsx`  
**Desktop:** Bars slide in, area fills bottom-up, pie slices rotate with labels  
**Mobile (≤375px):**
- Stagger duration: 80ms (vs 100ms desktop) for faster feel
- Animation duration: 0.8s (vs 1.2s desktop) for snappy charts
- Bar delay: 0 (no sequential delay on mobile to avoid long animation)
- Pie animation: simultaneous slice rotation (vs staggered) to reduce jank

**Responsive Spec:**
- Mobile: all animations compressed, 60% duration of desktop
- Tablet: 80% duration of desktop
- Desktop: full duration with detailed stagger

**Performance:** Profile chart render time on Galaxy S22; reduce stagger if >300ms total

---

### 3.2 KPI Cards 3D Tilt (Mobile-Friendly)
**File:** `src/components/analytics/KPICard3D.tsx`  
**Desktop:** Mouse-based 3D tilt, lift with dynamic shadow, border glow  
**Mobile (≤375px):**
- No 3D tilt (remove perspective transform on mobile)
- Lift removed (use scale only: 1.02 on touch)
- Shadow simplified: 0_2px_8px (vs 0_8px_20px desktop)
- Glow opacity: 0 on mobile (keep on desktop only)

**Responsive Spec:**
- Mobile: touch → scale 1.02, shadow increase
- Tablet: light 3D tilt (rotateX: 5, rotateY: -5 max)
- Desktop: full 3D perspective with dynamic shadow

**Touch-Safe:** No parallax tracking of mouse position (desktop only)

---

### 3.3 Live Stats Pulse (Heatmap Updates)
**File:** `src/components/map/LiveStatsPanel.tsx`  
**Desktop:** Heatmap cells pulse on update, color intensity reflects demand  
**Mobile (≤375px):**
- Pulse animation: 0.4s (vs 0.6s desktop) to avoid battery drain
- Update frequency: 5s (vs 3s desktop) to reduce animations on mobile
- Cell size: 32px (vs 48px desktop) to fit more cells in viewport
- Pulse scale: 0.95-1.05 (vs 0.9-1.1 desktop) for subtle effect

**Responsive Spec:**
- Mobile: small cells, fast pulse, less frequent updates
- Tablet: medium cells, normal pulse, 4s update
- Desktop: large cells, full pulse, 3s update

**Performance:** Limit to 4 concurrent pulse animations on mobile

---

## Implementation Order (Tier 3)

**Session 1 (1.5h):** Analytics Chart Animations
1. Add staggered bar animation to PriceDistribution chart (mobile: 80ms stagger)
2. Implement area fill animation (gradient bottom-up) for SupplyDemand
3. Add pie slice rotation for MarketSegment chart
4. Test on 3 devices (SE, Pixel 6, Galaxy S22)
5. Verify no chart jank during data updates
6. Commit with responsive chart animations

**Session 2 (1.0h):** KPI Cards 3D + Live Stats
1. Remove 3D tilt on mobile KPI cards (desktop-only perspective)
2. Simplify shadow and glow on mobile
3. Implement heatmap pulse with responsive frequency
4. Test cell size on small screens (360-375px)
5. Verify pulse doesn't drain battery on low-end devices
6. Commit with mobile-optimized analytics

**Session 3 (0.5h):** Tier 3 Mobile Optimization
1. Profile chart render time on Galaxy S22
2. Reduce stagger if animation >300ms total
3. Check KPI card tap response on touch
4. Verify heatmap updates don't cause layout shift
5. Run Lighthouse audit (target Performance >85)
6. Final mobile performance pass

---

## Tier 3 Mobile Testing Checklist

**Charts on Mobile:**
- [ ] PriceDistribution bars animate smoothly (80ms stagger)
- [ ] SupplyDemand area fill from bottom without jank
- [ ] MarketSegment pie rotates in < 1.2s total
- [ ] Tab switch doesn't re-trigger animations (cached state)
- [ ] No CLS when chart updates with new data

**KPI Cards on Mobile:**
- [ ] No 3D perspective tilt visible
- [ ] Tap response immediate (scale 1.02, no delay)
- [ ] Shadow subtle but visible
- [ ] Text readable on all KPI sizes

**Heatmap on Mobile:**
- [ ] Cells render at 32px size (fit >9 cells per row on 375px)
- [ ] Pulse animation smooth (0.4s, 0.95-1.05 scale)
- [ ] Update every 5s without battery drain (no >4 concurrent)
- [ ] Color legend readable (no cutoff on small screens)

**Performance Targets:**
- [ ] Chart animations <300ms total render time
- [ ] Heatmap pulse <50ms per update cycle
- [ ] 60fps during chart interactions
- [ ] No jank when switching between tabs

---

**Next:** Begin Tier 3 Session 1 implementation (Chart Animations)

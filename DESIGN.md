---
name: Premium Tactical Rental
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c2c6d8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8c90a1'
  outline-variant: '#424656'
  surface-tint: '#b3c5ff'
  primary: '#b3c5ff'
  on-primary: '#002b75'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#0054d6'
  secondary: '#d7ffc5'
  on-secondary: '#053900'
  secondary-container: '#2ff801'
  on-secondary-container: '#0f6d00'
  tertiary: '#c6c6c6'
  on-tertiary: '#2f3131'
  tertiary-container: '#717272'
  on-tertiary-container: '#f9f8f8'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#79ff5b'
  secondary-fixed-dim: '#2ae500'
  on-secondary-fixed: '#022100'
  on-secondary-fixed-variant: '#095300'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 80px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  technical-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max-width: 1440px
---

## Brand & Style
The design system is built for a premium, community-driven rental ecosystem that feels like a high-end digital command center. The personality is **exclusive, trustworthy, and precise**, evoking the immersive quality of a AAA gaming interface combined with the sophistication of a luxury marketplace.

The style is a hybrid of **Glassmorphism** and **Modern Skeuomorphism**. It utilizes depth, translucency, and tactile lighting to make digital objects feel physically interactable. High-contrast elements ensure immediate readability against a deep, light-absorbing background, creating a "HUD" (Heads-Up Display) aesthetic that empowers the user to navigate the community marketplace with authority.

## Colors
The palette is rooted in a "Pure Dark" philosophy to maximize contrast and reduce eye strain in high-utility environments.

- **Primary (Electric Blue):** Used for core action states, progress indicators, and "Power User" rewards. It should feel like it's emitting light.
- **Secondary (Neon Green):** Exclusively reserved for trust signals, "Verified" statuses, and successful availability checks. 
- **Neutral (Charcoal/Black):** The foundation. `#0A0A0A` serves as the base layer, while slightly lighter shades define container depth.
- **Accents (Silver/White):** High-clarity typography. Silver is used for secondary data to maintain a hierarchy that doesn't overwhelm the user.

## Typography
Typography in this design system emphasizes clarity and technical precision. 

**Geist** provides a clean, geometric foundation for all primary communication. For the landing page, headlines should be "massive"—utilizing the `display-hero` style to create a sense of scale and dominance.

**JetBrains Mono** is used as a functional accent. Apply this font to technical specifications (e.g., rental durations, price breakdowns, SKU numbers) and reward tiers to reinforce the "engineered" feel of the platform. All technical labels should be in uppercase to maximize their architectural presence.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

The rhythm is built on an 8px base unit. Hero sections should utilize generous vertical padding (120px+) to allow the glassmorphic elements to "breathe" against the dark void. In contrast, functional dashboard areas and rental lists should be high-density, utilizing tight 8px and 16px gaps to mimic a technical data interface.

Content should be contained within a 1440px max-width wrapper, centered on the screen, with margins expanding dynamically on ultra-wide displays.

## Elevation & Depth
Depth is the core of this design system's skeuomorphic-modern hybrid look.

1.  **Surface (Level 0):** `#0A0A0A` - The infinite background.
2.  **Plates (Level 1):** Glassmorphic surfaces with a `backdrop-filter: blur(20px)` and a 10% white opacity fill. Each plate must have a 0.5px solid border in `#FFFFFF` at 15% opacity to simulate a glass edge.
3.  **Raised (Level 2):** Active items or hovered cards. These use a subtle `inner-shadow` (top-left light source) to appear tactile and "pressed out" from the surface.
4.  **Glow (Level 3):** Primary CTAs and "Verified" badges utilize a localized outer glow (drop-shadow with 15px-20px blur) using their respective brand color at 30% opacity.

## Shapes
The shape language is **Soft (0.25rem / 4px)**. 

While the design is modern, it avoids overly "bubbly" or circular corners to maintain its professional, high-end edge. Small radii are used to keep the interface feeling precise and engineered. 

- **Standard Elements:** 4px radius (Buttons, Input fields).
- **Cards/Containers:** 8px radius (`rounded-lg`).
- **Accent Details:** 12px radius (`rounded-xl`) for large hero images or featured rental highlights.

## Components

- **Tactile Buttons:** Primary buttons use the Electric Blue gradient with a subtle top-down inner highlight (1px white at 20% opacity) to create a physical "pressable" feel. On hover, the outer glow intensity increases.
- **Glassmorphic Cards:** Used for rental listings. Features a blurred background, a thin silver stroke, and high-contrast white text. The price should always be highlighted in Electric Blue.
- **Map Pins:** Custom geometric shapes.
    - *Shield:* Verified community member home.
    - *Shield-Alert:* High-demand/Flash rental item.
    - *Building:* Commercial partner hub.
- **Input Fields:** Deep black background with a 1px silver border. When focused, the border glows Electric Blue.
- **Chips/Badges:** Use JetBrains Mono. "Verified" chips use a Neon Green border and a faint green glow. "Pro" or "Rare" chips use a Silver metallic gradient.
- **Reward Progress Bars:** Segmented bars (mimicking old-school hardware displays) that fill with Electric Blue as the user gains community trust points.


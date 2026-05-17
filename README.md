# indian.rent 🛰️

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

### Tactical Digital Command Center for Peer-to-Peer Rentals

**indian.rent** is a high-end, community-driven rental intelligence platform designed to bypass brokers and return market value to seekers and contributors. Built with a "Dark Tactical" HUD aesthetic, it transforms the house-hunting experience into a precise, mission-driven operation.

---

## ⚡ Core Mission: The "Anti-Broker Loop"
1.  **Spot:** Identify a vacant property or "To Let" sign.
2.  **Deploy:** Pin the exact rooftop node to the tactical grid using the orbital reticle.
3.  **Reward:** Earn a peer-to-peer **Good Faith Reward** via UPI when a tenant moves in, bypassing ₹50k+ in broker fees.

---

## 🛠️ Tactical Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (Turbopack)
- **Intelligence:** [Supabase](https://supabase.com/) + [PostGIS](https://postgis.net/) (Geospatial data layer)
- **Signal:** [Upstash Redis](https://upstash.com/) (Serverless map caching)
- **Visuals:** [Tailwind CSS 4](https://tailwindcss.com/) + [GSAP](https://greensock.com/gsap/) (Choreography)
- **Optics:** Google Maps (Primary) + Mapbox (Standby) with Supercluster
- **Motion:** Framer Motion + [Lenis](https://lenis.darkroom.engineering/) (Global smooth scroll)

---

## 🚀 Key Features

### 📡 Precision Orbital Deployment
- **Tactical Reticle:** A pulsing crosshair for exact rooftop pinning.
- **Sidebar HQ:** A non-obstructive sidebar for rapid data entry without losing map context.
- **Building Resolution:** Automatic PostGIS scan detects existing nodes within 50m to prevent data duplication.

### 🛡️ Community Moderation (Anti-Troll)
- **Intel Flagging:** Report stale or fraudulent intelligence.
- **Auto-Reversion:** Listings that receive 3 community flags are automatically reverted to "Vacant" by the protocol.

### 🌑 Visual Data Decay
- **Live Intelligence:** Markers pulse and glow when data is fresh.
- **Stale Protocol:** Listings older than 6 months automatically turn grayscale and dim, signaling a need for re-verification.

### 🔓 Anonymous Contribution
- **Zero Friction:** No sign-in required to deploy nodes or lock properties.
- **P2P Rewards:** Contributor Name and UPI ID are optionally captured to facilitate direct "Good Faith" payouts.

---

## 📂 Repository Structure
```text
indian-rent/
├── src/
│   ├── app/            # Next.js App Router (Explore, Auth, Listings)
│   ├── components/     # Tactical HUD Components (Map, UI, Animations)
│   ├── hooks/          # Custom Protocol Hooks
│   ├── lib/            # Signal & Intelligence Clients (Supabase, Redis)
│   └── utils/          # Protocol Utilities
├── supabase/
│   └── migrations/     # Tactical Schema & RLS Policies
├── public/             # Mission Assets (Icons, Map Mockups)
└── .gemini/            # Internal Protocol Documentation & Plans
```

---

## 💻 Technical Setup

### 1. Clone the Protocol
```bash
git clone https://github.com/your-username/indian.rent.git
cd indian-rent
```

### 2. Environment Configuration
Create a `.env.local` based on `.env.example`:
```bash
# Provider Toggle: 'google' or 'mapbox'
NEXT_PUBLIC_MAP_PROVIDER=google

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapping Keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Caching
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 3. Database Migration
Apply the tactical schema via Supabase Dashboard or CLI:
```sql
-- Apply: supabase/migrations/00001_initial_schema.sql
```

### 4. Initialization
```bash
npm install --legacy-peer-deps
npm run dev
```

---

## 🗺️ Intelligence Roadmap
- [x] **Phase 1:** Hyderabad Grid Online
- [x] **Phase 2:** Multi-Provider Mapping (Google/Mapbox)
- [x] **Phase 3:** Autonomous Building Resolution
- [x] **Phase 4:** Community Moderation Trigger
- [ ] **Phase 5:** Pan-India Sector Rollout
- [ ] **Phase 6:** Contributor Reward Dashboard

---

## 🤝 Contributing
Contributions are what make the open grid powerful. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Protocol Maintenance:** Maintain high-fidelity design standards. Reference `DESIGN.md` for skeuomorphic depth and HUD spacing rules.

*Take the market back.* 🌑🛰️

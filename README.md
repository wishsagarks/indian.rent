# 🛰️ indian.rent — Crowdsourced Rental Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/) [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**A product of [WishLabs](https://wishlabs.in)**

---

## 📖 What is indian.rent?

indian.rent is a **peer-to-peer rental discovery platform** that bypasses brokers and returns market value to renters and property contributors. Contributors (landlords, agents, existing tenants) pin rental properties on an interactive map, and seekers find direct listings without paying broker commissions.

**The Problem:** Rental brokers in India charge ₹50,000+, making it impossible for middle-income seekers to afford housing.

**The Solution:** A crowdsourced map where **direct contributors earn "Good Faith Rewards"** instead of brokers getting commissions.

### 🎯 Key Value Propositions
- **For Contributors:** Earn direct rewards (via UPI) when a tenant moves into your listed property — no broker needed
- **For Seekers:** Find 100% direct listings with verified pricing — no broker markups
- **For Communities:** Live demand heatmaps showing where people want to live (used for urban planning insights)

---

## 🚀 Quick Start

### For the Impatient (2 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/indian-rent.git
cd indian-rent

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy environment template
cp .env.example .env.local

# 4. Add your API keys (see Setup Guide below)
# Edit .env.local with your Supabase, Google Maps, and Mapbox keys

# 5. Start the dev server
npm run dev

# App will be available at http://localhost:3000
```

**🎉 That's it!** The app will load with read-only map mode if API keys are incomplete.

---

## 🎓 First Steps for Developers

### 1. **Understand the Project Structure**
```
indian-rent/
├── src/
│   ├── app/              # Next.js pages & API routes
│   │   ├── explore/      # Main map page
│   │   ├── api/          # Backend services (cron jobs, webhooks)
│   │   ├── analytics/    # Demand intelligence dashboard
│   │   └── actions/      # Server actions (form submissions)
│   │
│   ├── components/
│   │   ├── map/          # Map engine & interactions
│   │   ├── ui/           # Reusable UI components
│   │   └── animations/   # Motion & effects
│   │
│   ├── hooks/            # Custom React hooks (forms, authentication)
│   ├── lib/              # Database & API clients
│   └── utils/            # Helper functions
│
├── supabase/
│   ├── migrations/       # Database schema changes
│   └── functions/        # Edge functions (serverless)
│
└── public/               # Static assets (icons, images)
```

### 2. **Core Concepts (Read These First)**
- **Map Engine** (`src/components/map/RefinedMapEngine.tsx`) — Interactive map with property pins, filters, and clustering
- **Building System** — Properties are grouped by "buildings" (societies, apartments, houses)
- **Seeker Pins** — Demand signals where people want to live (anonymously)
- **Good Faith Rewards** — Payment system tracking who contributed which property

### 3. **Start Exploring**
- Open [`WIKI.md`](./WIKI.md) for detailed architecture & feature docs
- Check [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development guidelines
- See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system design diagrams

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js 16 App Router                  │
│           (Pages: /, /explore, /analytics, /flat)        │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
    ┌─────▼──────┐         ┌───────▼────────┐
    │  React UI  │         │  Server Actions │
    │ (Components)│         │  (API Routes)   │
    └──────┬──────┘         └────────┬────────┘
           │                        │
    ┌──────▼────────────────────────▼─────────┐
    │    Supabase Client (RLS Protected)      │
    │  - PostgreSQL with PostGIS              │
    │  - Real-time subscriptions              │
    │  - Row-level security policies          │
    └──────┬─────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │        Cloud Services                   │
    │  - Google Maps API (Geocoding)          │
    │  - Mapbox (Vector tiles)                │
    │  - Upstash Redis (Caching)              │
    │  - Vercel (Deployment)                  │
    └─────────────────────────────────────────┘
```

### Key Technologies
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Next.js 16 | UI framework |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Animations** | Framer Motion + GSAP | Smooth interactions |
| **Maps** | Google Maps + Mapbox | Geospatial visualization |
| **Database** | Supabase (PostgreSQL) | Data storage & auth |
| **Geospatial** | PostGIS | Location-based queries |
| **Caching** | Upstash Redis | Performance optimization |
| **Hosting** | Vercel | Serverless deployment |

---

## 💾 Database Schema (Simplified)

### Main Tables
```sql
-- Buildings (societies, apartments, houses)
buildings
  ├── id (UUID, primary key)
  ├── name (text, e.g., "Golden Apartments")
  ├── location (geometry, lat/lng)
  ├── city (text, e.g., "Bengaluru")
  └── category (enum, 'residential' | 'apartment')

-- Floors within buildings
floors
  ├── id (UUID, primary key)
  ├── building_id (foreign key)
  ├── floor_number (integer)
  └── created_at (timestamp)

-- Individual rental listings
flats
  ├── id (UUID, primary key)
  ├── floor_id (foreign key)
  ├── rent_amount (integer, monthly in ₹)
  ├── bhk (integer, bedroom count)
  ├── furnished (enum, 'unfurnished' | 'semi' | 'furnished')
  ├── status (enum, 'vacant' | 'occupied')
  ├── contributor_name (text, who listed it)
  ├── contributor_phone (text, for Good Faith payouts)
  └── created_at (timestamp)

-- Seeker demand pins
seeker_pins
  ├── id (UUID, primary key)
  ├── location (geometry, where they want to live)
  ├── budget (integer, max monthly rent)
  ├── bhk_preference (integer)
  └── created_at (timestamp)

-- Import tracking (prevents duplicate bengaluru.rent imports)
import_sources
  ├── source (text, e.g., 'bengaluru_rent')
  ├── source_id (text, original ID)
  ├── flat_id (foreign key, our listing)
  └── imported_at (timestamp)
```

---

## 🔧 Setup Guide (Detailed)

### Prerequisites
- **Node.js** ≥ 18.x ([download](https://nodejs.org/))
- **Git** ([download](https://git-scm.com/))
- **Supabase** account ([sign up](https://supabase.com))
- **Google Maps API key** ([get one](https://cloud.google.com/maps-platform))
- **Mapbox token** (optional, [get one](https://mapbox.com))

### Step 1: Clone & Install
```bash
git clone https://github.com/your-org/indian-rent.git
cd indian-rent
npm install --legacy-peer-deps  # Required for dependency compatibility
```

### Step 2: Get API Keys

#### A. Supabase (Database)
1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Project Settings → API → Copy:
   - `NEXT_PUBLIC_SUPABASE_URL` (public URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public key)
3. SQL Editor → Run all migrations from `supabase/migrations/` folder

#### B. Google Maps
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable APIs: "Maps JavaScript API", "Geocoding API", "Street View Static API"
4. Create an API key (Credentials → API Key)
5. Copy to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

#### C. Mapbox (Optional Fallback)
1. Go to [mapbox.com](https://mapbox.com) → Sign up
2. Copy access token to `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### Step 3: Environment Setup
```bash
# Create .env.local file
cat > .env.local << 'EOF'
# Map Provider ('google' or 'mapbox')
NEXT_PUBLIC_MAP_PROVIDER=google

# Database
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_KEY
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN

# Server-only secrets (for cron jobs, not exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
CRON_SECRET=your-random-32-char-secret

# Optional: Redis caching
UPSTASH_REDIS_REST_URL=https://YOUR_REDIS.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_REDIS_TOKEN
EOF
```

### Step 4: Run Migrations
```bash
# Option A: Using Supabase CLI
npm install -g supabase
supabase db push

# Option B: Manual - copy all files from supabase/migrations/ 
# and run them in Supabase Dashboard → SQL Editor
```

### Step 5: Start Development Server
```bash
npm run dev
# App opens at http://localhost:3000
```

---

## 🗺️ Key Features Explained

### 1. **Tactical Reticle (Add Property)**
- Click the **+** button at the bottom of the map
- A crosshair appears — move your cursor to pinpoint the building
- Form opens on the sidebar with fields for:
  - Building name (auto-filled if it exists nearby)
  - Floor number
  - Rent amount, BHK, furnishing, deposit
  - Your contact (optional, for Good Faith payouts)

### 2. **Property Filtering**
- **By Budget:** Slider to show rentals within your price range
- **By BHK:** Filter 1BHK, 2BHK, 3BHK+
- **By Furnishing:** Unfurnished / Semi-furnished / Furnished
- **By Status:** Vacant only, or include occupied for reference

### 3. **Analytics Dashboard** (`/analytics`)
- **Live Stats:** Total listings, seekers, avg rent by area
- **Demand Heatmap:** Where seeker pins are concentrated
- **Area Velocity:** Which areas got new listings this month

### 4. **Seeker Mode**
- Click the **Hunt** button (bottom nav) to drop a "Looking for" pin
- Your pin appears on the analytics dashboard as demand signal
- Landlords see where demand is and price accordingly
- Your data stays anonymous

### 5. **Good Faith Rewards**
- Contribute a property → Track it in your dashboard
- When a seeker moves in, landlord sends a direct reward (via UPI)
- No intermediaries, no fees

---

## 📁 File Guide for Newcomers

### Most Important Files (Start Here)
```
src/app/explore/page.tsx               # Main map page entry point
src/components/map/RefinedMapEngine.tsx # Map UI & interactions (900+ lines)
src/components/map/AddPropertyForm.tsx  # Property submission form
src/app/actions/map-actions.ts          # Server logic (deployNode RPC)
src/app/analytics/AnalyticsDashboard.tsx # Demand analytics dashboard
supabase/migrations/                    # Database schema
```

### Component Tree
```
app/explore/page.tsx
└── RefinedMapEngine.tsx
    ├── Map (Google Maps or Mapbox)
    ├── PropertyPopup (showing listing details)
    ├── AddPropertyForm (form to add new property)
    ├── FilterPanel (budget, BHK, furnishing filters)
    ├── MetroOverlay (metro lines visualization)
    ├── Legend (map key explaining colors)
    └── Mobile Nav (bottom action buttons)
```

---

## 🛠️ Common Development Tasks

### Add a New Database Field
1. Create migration: `supabase/migrations/YYYYMMDD_description.sql`
2. Update TypeScript interfaces in `src/lib/types.ts`
3. Update forms/components to use the new field
4. Test locally: `npm run dev`

### Add a New Map Marker Type
1. Add to `MarkerType` enum in `src/lib/types.ts`
2. Update clustering logic in `RefinedMapEngine.tsx`
3. Add styling (colors, icons) in component
4. Test with sample data

### Fix a Mobile Layout Issue
1. Check Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
2. Use responsive classes: `hidden lg:block` to hide on mobile
3. Test with `npm run dev` and browser DevTools mobile mode

### Add a New API Endpoint
1. Create file: `src/app/api/your-endpoint/route.ts`
2. Export `GET` or `POST` function
3. Use Supabase client to query database
4. Return JSON response

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Add a property on mobile (test form steps)
- [ ] Filter properties by budget & BHK
- [ ] Switch between Google Maps and Mapbox
- [ ] Drop a seeker pin on analytics page
- [ ] View analytics dashboard stats
- [ ] Test on iPhone 12, iPad, Desktop (responsive)

### Running Tests
```bash
# Lint check
npm run lint

# Type check
npm run build

# Visual regression tests
npx tsx visual-regression-test.ts
```

---

## 🐛 Troubleshooting

### "Map won't load"
- **Cause:** API key missing or invalid
- **Fix:** Check `.env.local` has correct `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Fallback:** App uses Mapbox if Google fails

### "Buildings not clustering properly"
- **Cause:** PostGIS queries returning wrong results
- **Fix:** Check `supabase/migrations/` for ST_DWithin distance settings
- **Debug:** View Network tab → check `/api/map` response

### "Form submission hangs"
- **Cause:** Supabase database cold-start (free tier hibernation)
- **Fix:** Form includes retry logic. Wait 2-5 seconds, try again
- **Better:** Add `SUPABASE_SERVICE_ROLE_KEY` to env to wake DB

### "Styles not applying"
- **Cause:** Tailwind CSS not rebuilding
- **Fix:** Stop dev server, run `npm run dev` again

---

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| **[WIKI.md](./WIKI.md)** | Detailed feature documentation & architecture |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design, data flows, and API contracts |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Development workflow, PR guidelines, commit style |
| **[CLAUDE.md](./CLAUDE.md)** | AI-assistant guidelines (for GitHub Copilot, Claude Code) |
| **[UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)** | UX roadmap and known issues |

---

## 🤝 Contributing

We love contributions! This is an open-source project, and we welcome all skill levels.

### Quick Contribution Steps
1. **Find an Issue:** Check [Issues](https://github.com/your-org/indian-rent/issues) or propose a feature
2. **Fork & Branch:** `git checkout -b feature/your-feature`
3. **Code:** Make your changes following our [style guide](./CONTRIBUTING.md#code-style)
4. **Test:** Run `npm run build` and `npm run lint` locally
5. **Commit:** `git commit -m "feat: clear description of what changed"`
6. **Push & PR:** Push to your fork and open a pull request

### Ways to Contribute
- **Bug Fixes:** Found a bug? Open an issue with steps to reproduce
- **Features:** Propose new features in Discussions
- **Docs:** Improve README, WIKI, or inline code comments
- **Testing:** Try the app on different devices and report issues
- **Design:** Improve UI/UX with mockups or screenshots

### Code Standards
- Use **TypeScript** (no `any` types unless necessary)
- Follow **Tailwind CSS** utility-first approach
- Write **clear commit messages** (see examples in [CONTRIBUTING.md](./CONTRIBUTING.md))
- Keep components **focused and reusable**
- Add **comments for non-obvious logic**

### Community
- **Questions?** Open a Discussion or ask in Issues
- **Want to chat?** DM [@wishsagar](https://twitter.com/wishsagar) on Twitter
- **Found a security issue?** Email security@wishlabs.in (don't open a public issue)

---

## 📊 Project Stats

- **Lines of Code:** ~15,000+
- **Components:** 40+
- **API Endpoints:** 12+
- **Database Tables:** 8+
- **Supported Cities:** Bengaluru (Hyderabad coming soon)
- **Active Contributors:** Growing community!

---

## 🎯 Roadmap

### Current (May 2026)
- [x] Multi-city support (Bengaluru map)
- [x] Analytics dashboard with demand heatmaps
- [x] Metro overlay visualization
- [x] Form progress indicators
- [x] Mobile responsive design

### Next Sprint
- [ ] Payment integration for Good Faith rewards
- [ ] Contributor dashboard (track your listings)
- [ ] Enhanced search (by locality, amenities)
- [ ] Community moderation tools
- [ ] Verified landlord badges

### Future
- [ ] Pan-India rollout (all cities)
- [ ] Mobile app (iOS/Android)
- [ ] AI rent prediction
- [ ] Flatmate matching
- [ ] Property insights API

---

## 📜 License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) file for details.

**TL;DR:** You can use, modify, and distribute this code freely, even for commercial projects. Just keep the license notice intact.

---

## 🙏 Acknowledgments

- **Design Inspiration:** Dark tactical HUDs (military UI, Bloomberg Terminal)
- **Tech Stack:** Next.js, Vercel, Supabase, and the entire open-source community
- **Community:** Everyone who's contributed properties, feedback, and ideas

---

## 📞 Get in Touch

- **Website:** [wishlabs.in](https://wishlabs.in)
- **Twitter:** [@freaking_wish](https://twitter.com/freaking_wish)
- **Email:** wishsagarks@gmail.com
- **Issues:** [GitHub Issues](https://github.com/your-org/indian-rent/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/indian-rent/discussions)

---

**Made with ❤️ by [WishLabs](https://wishlabs.in) • Take the market back. 🛰️**

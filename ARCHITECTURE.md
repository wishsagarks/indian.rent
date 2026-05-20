# indian.rent Architecture

Complete system design documentation. Start with **System Overview** if you're new.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Database Schema](#database-schema)
5. [API Contracts](#api-contracts)
6. [Deployment Architecture](#deployment-architecture)
7. [Security Model](#security-model)

---

## System Overview

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser (React)                          │
│                     indian.rent Web Application                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Pages: / (landing) | /explore (map) | /analytics | /flat  │ │
│  │  Components: RefinedMapEngine, AddPropertyForm, Dashboard  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                 HTTP/REST API Calls
                           │
    ┌──────────────────────┴──────────────────────┐
    │                                             │
┌───▼──────────────────┐          ┌─────────────▼──────────┐
│  Next.js Server      │          │  Supabase Realtime     │
│  (Vercel Serverless) │          │  (WebSocket Sub.)      │
│                      │          │                        │
│  - Server Actions    │          │  - Live updates on     │
│  - API Routes        │          │    flats, seeker pins  │
│  - Cron Jobs         │          │  - Presence tracking   │
│  - Auth Middleware   │          └────────────────────────┘
│                      │
│  /api/cron/import    │
│  /api/map/search     │
│  /api/analytics      │
└───┬──────────────────┘
    │
    │ (Encrypted Connection)
    │
┌───▼──────────────────────────────────────────────┐
│         Supabase Cloud (PostgreSQL + Auth)       │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │       PostgreSQL Database (PostGIS)        │ │
│  │  - buildings, floors, flats tables         │ │
│  │  - seeker_pins, import_sources tables      │ │
│  │  - Row-level security enabled              │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │      Supabase Auth (JWT tokens)            │ │
│  │  - Email/password authentication           │ │
│  │  - Session management                      │ │
│  │  - User ID in JWT claims                   │ │
│  └────────────────────────────────────────────┘ │
└───┬──────────────────────────────────────────────┘
    │
    ├─── Caching Layer (Upstash Redis)
    │    - Building list cache
    │    - Analytics stats cache
    │    - Seeker pins density cache
    │    - TTL: 1-60 minutes per key
    │
    └─── External APIs
         - Google Maps (Geocoding, Street View)
         - Mapbox (Vector tiles, GeoJSON)
         - Vercel Analytics
```

### Key Decision Points

**Why Next.js?**
- Full-stack (frontend + API) in one framework
- Vercel deployment (easy CI/CD)
- Server Components (faster data loading)
- API Routes for serverless functions

**Why Supabase?**
- PostgreSQL (ACID transactions)
- PostGIS (geospatial queries)
- Built-in auth (JWT tokens)
- Real-time subscriptions (WebSocket)
- Row-level security (encrypted access control)

**Why Vercel?**
- Automatic deployments on git push
- Serverless functions (no server to manage)
- Global CDN (fast page loads)
- Integrated analytics

---

## Component Architecture

### Page Structure

```
src/app/
├── page.tsx                    # Landing page (/)
│   └── LandingPage component
│
├── explore/
│   └── page.tsx                # Map explorer (/explore)
│       └── RefinedMapEngine (main map UI)
│
├── analytics/
│   └── page.tsx                # Analytics dashboard (/analytics)
│       └── AnalyticsDashboard (demand heatmap)
│
├── [slug]/
│   └── page.tsx                # Listing detail page (/flat/[id])
│       └── ListingDetail (single property view)
│
└── api/
    ├── map/
    │   └── route.ts            # GET /api/map (search listings)
    ├── analytics/
    │   └── route.ts            # GET /api/analytics (stats)
    └── cron/
        └── import/route.ts     # Cron job: daily bengaluru.rent import
```

### Component Tree (Map Page)

```
ExplorePage (/explore)
│
└── MapErrorBoundary (catches rendering errors)
    │
    └── RefinedMapEngine (main map container)
        │
        ├── Map (Google Maps or Mapbox provider)
        │
        ├── PropertyPopup (detail card for selected pin)
        │   ├── Building info (name, category)
        │   ├── Flat details (rent, BHK, furnished)
        │   ├── Contact info
        │   └── Action buttons (Share, Copy link, Delete)
        │
        ├── AddPropertyForm (slide-in form)
        │   ├── Step 1: Building lookup & location
        │   ├── Step 2: Floor/flat numbers
        │   ├── Step 3: Rental details
        │   └── Step 4: Contributor contact
        │
        ├── FilterPanel (sidebar)
        │   ├── Budget slider
        │   ├── BHK filter
        │   ├── Furnishing filter
        │   └── Status toggle
        │
        ├── Legend (map key)
        │
        ├── MetroOverlay (metro lines visualization)
        │
        └── Mobile Nav (bottom action buttons on small screens)
            ├── + (Add property)
            ├── 📊 (Area stats)
            ├── 🔍 (Filter panel)
            └── ❓ (Help/legend)
```

### Component Responsibility

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **RefinedMapEngine** | Main map UI orchestrator | Manages state, filters, interactions |
| **AddPropertyForm** | Multi-step property submission | Form validation, progress bar, submission |
| **PropertyPopup** | Detail card for selected listing | Shows all property info, actions |
| **FilterPanel** | Budget/BHK/furnishing filters | Real-time filter updates |
| **MetroOverlay** | Metro station visualization | Markers + polylines between stations |
| **AnalyticsDashboard** | Demand insights | Heatmap, top areas, BHK distribution |
| **MapErrorBoundary** | Crash prevention | Catches rendering errors, shows fallback |

---

## Data Flow

### Adding a Property (Happy Path)

```
1. User clicks "+" button
   ↓
2. RefinedMapEngine: setIsAddingProperty(true)
   ↓
3. AddPropertyForm mounts with Step 1
   ↓
4. User enters building name, sees suggestions
   ↓
5. User clicks pin on map to confirm location
   ↓
6. User fills Steps 2, 3, 4
   ↓
7. User clicks "Submit"
   ↓
8. Form validation: all required fields present?
   ✗ YES → Error toast, stay on form
   ✓ YES → Continue
   ↓
9. Call deployNode() server action
   ↓
10. Server: Call deploy_node_atomic() RPC
    ↓
11. Database: Transaction
    • Find or create building
    • Create floor
    • Create flat listing
    ↓
12. Return flat ID to client
    ↓
13. Client: Show success toast "Property listed!"
    ↓
14. Close form, refresh map
    ↓
15. New pin appears on map! 🎉
```

### Error Handling in Submission

```
User clicks Submit
   ↓
Validation fails?
   ├─ YES → Show error in form, don't submit
   └─ NO → Continue
   ↓
Server action called
   ↓
Network error?
   ├─ YES → Show retry button
   └─ NO → Continue
   ↓
Database error?
   ├─ YES → Check error code
   │  ├─ 57014 (timeout) → Auto-retry after 2s
   │  ├─ 23505 (duplicate) → Show friendly error
   │  └─ Other → Show detailed error
   └─ NO → Success!
```

### Real-Time Updates (Seeker Pins)

```
Page loads
   ↓
useEffect: subscribeToSeekerPins()
   ↓
Supabase: Open WebSocket subscription to seeker_pins table
   ↓
When new pin added (anywhere):
   ├─ WebSocket notifies all connected clients
   ├─ Update local state: setSeekerPins([...newPin])
   └─ Analytics dashboard refreshes heatmap
```

---

## Database Schema

### Core Tables (Simplified)

#### buildings
```sql
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,  -- PostGIS: Lat/Lng
  city TEXT NOT NULL,                       -- "Bengaluru", "Hyderabad"
  category TEXT,                            -- "residential", "apartment"
  gated_community BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Indexes for performance
  UNIQUE(name, ST_GeomFromText(location, 4326), city)  -- Prevent dupes
);

CREATE INDEX buildings_location_idx ON buildings USING GIST(location);
CREATE INDEX buildings_city_idx ON buildings(city);
```

**Why this structure?**
- Single source of truth for building metadata
- Prevents duplicate building entries
- PostGIS for geographic queries

#### floors
```sql
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_number INTEGER NOT NULL,  -- 0=ground, 1=first, etc.
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(building_id, floor_number)
);
```

**Why separate from flats?**
- Different floor may have different rental rates
- Flexibility for future floor-specific features (amenities, shared spaces)

#### flats
```sql
CREATE TABLE flats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  
  -- Listing details
  flat_number TEXT,                        -- "101", "A1"
  rent_amount INTEGER NOT NULL,            -- In ₹
  bhk INTEGER,                             -- 1, 2, 3, 4
  size_sqft INTEGER,                       -- Carpet area
  furnished TEXT DEFAULT 'unfurnished',    -- unfurnished | semi | furnished
  maintenance_extra BOOLEAN DEFAULT false, -- Extra on top of rent?
  deposit_months INTEGER DEFAULT 2,        -- Security deposit
  
  -- Preferences
  pets_allowed BOOLEAN DEFAULT false,
  tenant_preference TEXT DEFAULT 'any',    -- bachelors | families | any
  looking_for_flatmate BOOLEAN DEFAULT false,
  available_from DATE,
  
  -- Status & metadata
  status TEXT DEFAULT 'vacant',             -- vacant | occupied
  flagged_count INTEGER DEFAULT 0,          -- Community reports
  
  -- Contributor info
  contributor_name TEXT,
  contributor_email TEXT,
  contributor_phone TEXT,
  ip_hash TEXT,                            -- SHA256 hash (privacy)
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX flats_city_status_idx ON flats(status) 
  WHERE status = 'vacant';  -- Fast vacant-only queries
```

#### seeker_pins
```sql
CREATE TABLE seeker_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location GEOMETRY(Point, 4326) NOT NULL,  -- Where they want to live
  city TEXT NOT NULL,
  budget INTEGER,                            -- Max monthly rent
  bhk_preference INTEGER,
  furnished_preference TEXT,
  tenant_preference TEXT,
  looking_for_flatmate BOOLEAN,
  contact_email TEXT,                        -- Optional
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX seeker_pins_location_idx ON seeker_pins USING GIST(location);
```

#### import_sources
```sql
CREATE TABLE import_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                     -- "bengaluru_rent"
  source_id TEXT NOT NULL,                  -- Original ID
  flat_id UUID REFERENCES flats(id) ON DELETE SET NULL,
  imported_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(source, source_id)                 -- Prevent re-imports
);
```

### PostGIS Functions

**Find nearby buildings:**
```sql
SELECT id, name, 
  ST_Distance(location::geography, ST_SetSRID(ST_Point(77.6094, 12.9757), 4326)::geography) as distance
FROM buildings
WHERE ST_DWithin(location::geography, ST_SetSRID(ST_Point(77.6094, 12.9757), 4326)::geography, 100)
ORDER BY distance;
-- Finds all buildings within 100m, ordered by distance
```

**Cluster seeker pins:**
```sql
SELECT 
  FLOOR(ST_X(location) * 1000) / 1000 as lat_grid,
  FLOOR(ST_Y(location) * 1000) / 1000 as lng_grid,
  COUNT(*) as pin_count
FROM seeker_pins
WHERE created_at > now() - interval '30 days'
GROUP BY lat_grid, lng_grid
ORDER BY pin_count DESC;
-- Groups pins into grid cells for heatmap
```

---

## API Contracts

### Server Actions (RPC-Style)

#### deployNode
Creates a new property listing.

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  societyName: string;
  gatedCommunity: boolean;
  floorNumber: number;
  flatNumber: string;
  rentAmount: number;
  bhk: number;
  sizeSquareFeet?: number;
  furnished: 'unfurnished' | 'semi' | 'furnished';
  maintenanceExtra: boolean;
  depositMonths: number;
  petsAllowed: boolean;
  tenantPreference: 'bachelors' | 'families' | 'any';
  lookingForFlatmate: boolean;
  availableFrom?: string;
  contributorName: string;
  contributorEmail: string;
  contributorPhone: string;
}
```

**Output:**
```typescript
{
  success: true;
  flatId: string;        // UUID of created flat
  buildingId: string;    // UUID of building
  message: string;       // "Property listed successfully"
}
```

**Error Codes:**
- `VALIDATION_ERROR` — Missing required fields
- `LOCATION_ERROR` — Invalid coordinates
- `DEPLOYMENT_FAILED` — Database error
- `DUPLICATE_BUILDING` — Building already exists nearby

#### dropSeekerPin
Create a "looking for flat" demand signal.

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  budget: number;
  bhkPreference: number;
  tenantPreference: 'bachelors' | 'families' | 'any';
  contactEmail?: string;
}
```

**Output:**
```typescript
{
  success: true;
  pinId: string;
  message: string;
}
```

### HTTP API Routes

#### GET /api/map
Search listings with filters.

**Query Parameters:**
```
?city=Bengaluru
&maxBudget=50000
&bhk=2
&furnished=semi
&status=vacant
&lat=12.97
&lng=77.61
&zoom=13
```

**Response:**
```json
{
  "flats": [
    {
      "id": "uuid",
      "building": {
        "name": "Golden Apartments",
        "location": [12.9716, 77.5946],
        "gated": true
      },
      "rentAmount": 45000,
      "bhk": 2,
      "furnished": "semi",
      "status": "vacant",
      "createdAt": "2026-05-19T10:30:00Z"
    }
  ],
  "count": 127,
  "cachedAt": "2026-05-19T10:35:00Z"
}
```

#### GET /api/analytics
Get dashboard stats.

**Query Parameters:**
```
?city=Bengaluru
&period=30days  // 7days | 30days | 90days | all
```

**Response:**
```json
{
  "totalListings": 2847,
  "totalSeekerPins": 1203,
  "avgRent": 38500,
  "newListingsToday": 12,
  "averageBhk": 2.1,
  "furnishedPercent": 45,
  "demandHotspots": [
    {
      "area": "Indiranagar",
      "lat": 12.9784,
      "lng": 77.6408,
      "seekerPins": 45,
      "listings": 234
    }
  ]
}
```

#### POST /api/cron/import
Daily bengaluru.rent data import (triggered by Vercel cron).

**Headers:**
```
Authorization: Bearer $CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "imported": 45,
  "skipped": 4534,
  "failed": 0,
  "totalProcessed": 4579
}
```

---

## Deployment Architecture

### Local Development
```
npm run dev
  ↓
Turbopack watches src/ files
  ↓
Hot reload on save
  ↓
http://localhost:3000
```

### Production Deployment

```
Developer pushes to GitHub (main branch)
  ↓
GitHub webhook → Vercel API
  ↓
Vercel creates new deployment
  ├─ npm run build
  │  ├─ Next.js compiles React components
  │  ├─ Tailwind CSS generates stylesheet
  │  └─ TypeScript type-checks
  ├─ Upload to Vercel edge network
  └─ Deploy to serverless functions
  ↓
Custom domain routing
  ├─ indian.rent → Vercel deployment
  └─ api.indian.rent → Edge Functions
  ↓
Global CDN caches static assets (HTML, CSS, JS)
```

### Environment Variables by Stage

**Development (.env.local):**
- Maps to localhost:3000
- Uses test API keys
- Verbose logging

**Production (Vercel Project Settings):**
- Maps to indian.rent
- Real API keys with quotas
- Error tracking enabled

---

## Security Model

### Authentication Flow

```
User navigates to /explore
  ↓
Supabase checks for JWT in cookies
  ├─ Valid JWT? → Proceed (logged in)
  └─ Expired/missing? → Anonymous mode (read-only)
  ↓
For form submission:
  ├─ If logged in → Use user ID from JWT
  └─ If anonymous → Use IP hash for rate-limiting
```

### Authorization (Row-Level Security)

```sql
-- Every table has RLS enabled
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;

-- Public: Anyone can read vacant flats
CREATE POLICY "view_vacant_flats" ON flats
  FOR SELECT USING (status = 'vacant');

-- Restricted: Only contributor can delete their own flat
CREATE POLICY "delete_own_flats" ON flats
  FOR DELETE USING (
    auth.uid() = contributor_id OR ip_hash = current_user_ip_hash
  );
```

### Data Privacy

```
Sensitive Data Handling:
├─ Contributor email → Hashed in display, only visible to owner
├─ Contributor phone → Only revealed when sharing via WhatsApp
└─ User IP → SHA256 hashed, never stored directly
```

---

## Error Handling Strategy

```
Client-side Error:
├─ Form validation → Show red input border + helper text
├─ Network error → Show retry button (auto-retry after 2s)
├─ API error → Show toast with user-friendly message
└─ Unexpected error → Error boundary shows fallback UI

Server-side Error:
├─ Database error → Log to Supabase, return 500
├─ Auth error → Return 401, redirect to login
└─ Rate limit → Return 429, tell client to retry after X seconds
```

---

## Performance Optimizations

### Caching Strategy

```
Browser Cache (HTTP Cache-Control):
├─ Static assets (JS, CSS) → 1 year
├─ HTML (map page) → 1 minute
└─ API responses → 5 minutes

Server Cache (Redis):
├─ Building list → 1 hour
├─ Analytics stats → 10 minutes
└─ Seeker pins density → 5 minutes

Query Optimization:
├─ Index on location (PostGIS GIST)
├─ Index on city + status
└─ Join flats→floors→buildings in single query
```

### Code Splitting

```
Main Bundle: 150KB
├─ React framework
├─ Next.js runtime
└─ Core UI components

Map Bundle: 300KB (loaded on /explore)
├─ Google Maps library
├─ Mapbox library
└─ Map-specific components

Analytics Bundle: 200KB (loaded on /analytics)
├─ Chart.js library
└─ Analytics dashboard
```

---

**Last updated: May 2026**

*Questions? See [WIKI.md](./WIKI.md) for more details or [CONTRIBUTING.md](./CONTRIBUTING.md) to help improve this documentation.*

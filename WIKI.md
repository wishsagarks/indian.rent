# indian.rent Wiki — Complete Feature & Architecture Reference

Welcome to the indian.rent knowledge base. This document covers architecture, features, data structures, and advanced concepts.

---

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Data Models & Schema](#data-models--schema)
3. [Feature Modules](#feature-modules)
4. [API Reference](#api-reference)
5. [Map Engine Deep Dive](#map-engine-deep-dive)
6. [Database Design](#database-design)
7. [Performance & Caching](#performance--caching)
8. [Security & Privacy](#security--privacy)
9. [Deployment & DevOps](#deployment--devops)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Core Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser / React Frontend                      │
│          (RefinedMapEngine, AddPropertyForm, etc.)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          HTTP/REST & WebSocket (Real-time updates)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   ┌────▼──────────────┐          ┌─────────▼────────┐
   │  Next.js API      │          │  Supabase Auth   │
   │  - Server Actions │          │  - JWT Tokens    │
   │  - API Routes     │          │  - RLS Policies  │
   │  - Cron Jobs      │          │  - MFA Support   │
   └────┬──────────────┘          └────────┬─────────┘
        │                                  │
        └──────────────────┬───────────────┘
                           │
        ┌──────────────────┴───────────────────┐
        │                                      │
   ┌────▼──────────────────┐    ┌────────────▼─────┐
   │  PostgreSQL Database  │    │  PostGIS (Geo)   │
   │  - buildings table    │    │  - ST_DWithin    │
   │  - floors table       │    │  - ST_Distance   │
   │  - flats table        │    │  - Point queries │
   │  - seeker_pins table  │    │                  │
   │  - import_sources tbl │    │                  │
   └────────────┬──────────┘    └─────────────────┘
                │
        ┌───────┴──────────┐
        │                  │
   ┌────▼─────────┐  ┌────▼──────────┐
   │ External APIs│  │ Caching Layer │
   │ - Google Maps│  │ - Redis       │
   │ - Mapbox     │  │ - Upstash     │
   └──────────────┘  └───────────────┘
```

### Key Patterns

#### 1. **Server Actions (Form Submission)**
Instead of traditional REST APIs, we use Next.js Server Actions for form handling:

```typescript
// Client component calls server action
'use client';
const result = await deployNode({
  name: 'Golden Apartments',
  latitude: 12.9716,
  longitude: 77.5946,
  // ... form data
});
```

```typescript
// Server action with database transaction
'use server';
export async function deployNode(input: DeployNodeInput) {
  const supabase = createServiceClient(); // Uses SERVICE_ROLE_KEY
  
  // All 4 inserts happen in one transaction via RPC
  const { data, error } = await supabase.rpc('deploy_node_atomic', {
    p_society: input.name,
    p_lat: input.latitude,
    // ... other params
  });
  
  if (error) throw new Error(error.message);
  return data;
}
```

**Why Server Actions?**
- Automatic CSRF protection
- Type-safe RPC
- Easier code-splitting
- Server-side validation & auth

#### 2. **Supabase RPC (Remote Procedure Calls)**
Complex multi-step operations are wrapped in database functions:

```sql
-- Atomic deployment: Creates building, floor, flat in one transaction
CREATE OR REPLACE FUNCTION deploy_node_atomic(
  p_society TEXT,
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_bhk INTEGER,
  p_rent_amount INTEGER,
  -- ... 20+ params
) RETURNS UUID AS $$
BEGIN
  -- 1. Find or create building
  INSERT INTO buildings (name, location, city)
  VALUES (p_society, ST_SetSRID(ST_Point(p_lng, p_lat), 4326), 'Bengaluru')
  ON CONFLICT DO NOTHING;
  
  -- 2. Create floor
  INSERT INTO floors (building_id, floor_number)
  VALUES ((SELECT id FROM buildings WHERE ...), 1)
  ON CONFLICT DO NOTHING;
  
  -- 3. Create flat listing
  INSERT INTO flats (floor_id, rent_amount, bhk, ...)
  VALUES (...);
  
  RETURN (SELECT id FROM flats WHERE ...);
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Deployment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefits:**
- Single database round-trip (faster)
- ACID transactions (all-or-nothing)
- Encapsulates complex logic
- Easier to audit & maintain

#### 3. **Row-Level Security (RLS)**
Every table has policies that control who can see/modify what:

```sql
-- Only authenticated users can see flats
CREATE POLICY "view_flats" ON flats
  FOR SELECT USING (true);  -- Anyone can see
  
-- Only contributors can update their own properties
CREATE POLICY "update_own_flats" ON flats
  FOR UPDATE USING (
    auth.uid() = contributor_id
  );
```

---

## Data Models & Schema

### Buildings Table
Represents physical properties (societies, apartment complexes, houses):

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `name` | TEXT | "Golden Apartments", "House on 8th Cross" |
| `location` | GEOMETRY (Point) | Lat/Lng stored as PostGIS point |
| `city` | TEXT | "Bengaluru", "Hyderabad" |
| `category` | ENUM | 'residential' \| 'apartment' \| 'commercial' |
| `gated_community` | BOOLEAN | True if gated/secure |
| `created_at` | TIMESTAMP | Auto-set on creation |
| `updated_at` | TIMESTAMP | Auto-updated on changes |

**Indexes:**
```sql
CREATE INDEX buildings_location_idx ON buildings 
  USING gist (location);  -- For geographic queries
CREATE INDEX buildings_city_idx ON buildings (city);
```

### Floors Table
Intermediate table linking buildings to individual flats:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `building_id` | UUID | Foreign key to buildings |
| `floor_number` | INTEGER | 1, 2, 3, etc. (or 0 for ground floor) |
| `created_at` | TIMESTAMP | |

**Why this table?**
Real buildings have multiple floors. Floor 1 might rent for ₹30k, Floor 5 for ₹40k. Separates building metadata from floor-specific data.

### Flats Table
Individual rental listings:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `floor_id` | UUID | Foreign key to floors |
| `flat_number` | TEXT | "101", "A1", or "1" |
| `rent_amount` | INTEGER | Monthly rent in ₹ |
| `bhk` | INTEGER | 1, 2, 3, 4 (bedrooms) |
| `size_sqft` | INTEGER | Carpet area in sq ft |
| `furnished` | ENUM | 'unfurnished' \| 'semi' \| 'furnished' |
| `maintenance_extra` | BOOLEAN | If maintenance is on top of rent |
| `deposit_months` | INTEGER | Security deposit in months of rent |
| `pets_allowed` | BOOLEAN | True if pets OK |
| `tenant_preference` | TEXT | 'bachelors' \| 'families' \| 'any' |
| `looking_for_flatmate` | BOOLEAN | Can seeker find flatmate here? |
| `available_from` | DATE | Move-in date |
| `status` | ENUM | 'vacant' \| 'occupied' |
| `contributor_name` | TEXT | Who listed it |
| `contributor_email` | TEXT | Contact for Good Faith payout |
| `contributor_phone` | TEXT | WhatsApp for quick coordination |
| `ip_hash` | TEXT | SHA256 hash of contributor IP (privacy) |
| `flagged_count` | INTEGER | Count of community flags (>3 → revert to vacant) |
| `created_at` | TIMESTAMP | When listed |
| `updated_at` | TIMESTAMP | Last updated |

### Seeker Pins Table
Demand signals showing where people want to live:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `location` | GEOMETRY (Point) | Where they want to live |
| `city` | TEXT | "Bengaluru" |
| `budget` | INTEGER | Max monthly rent in ₹ |
| `bhk_preference` | INTEGER | 1, 2, 3, etc. |
| `furnished_preference` | ENUM | Same as flats |
| `tenant_preference` | TEXT | Same as flats |
| `looking_for_flatmate` | BOOLEAN | Open to sharing? |
| `contact_email` | TEXT | (Optional) for matching |
| `created_at` | TIMESTAMP | When pin dropped |

### Import Sources Table
Tracks which pins came from bulk imports (prevents duplicates):

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `source` | TEXT | 'bengaluru_rent', 'manual', etc. |
| `source_id` | TEXT | ID from the source system |
| `flat_id` | UUID | Our listing ID |
| `imported_at` | TIMESTAMP | When imported |

**Key:** Composite unique index on (source, source_id) ensures no duplicate imports.

---

## Feature Modules

### 1. Map Engine (RefinedMapEngine.tsx)

**Responsibility:** Interactive map with property pins, filtering, and clustering.

**Key State Variables:**
```typescript
const [selectedProperty, setSelectedProperty] = useState();    // Selected pin detail
const [filteredPoints, setFilteredPoints] = useState([]);      // Filtered listings
const [showAddForm, setShowAddForm] = useState(false);        // Add property form visible?
const [showAreaStats, setShowAreaStats] = useState(false);    // Analytics popup visible?
const [isAddingProperty, setIsAddingProperty] = useState(false); // Currently adding property?
```

**Core Functions:**
- `handleMapClick(e)` — User clicks on map to add property
- `handlePropertyClick(property)` — User clicks existing pin
- `applyFilters()` — Recalculate visible listings based on filters
- `deployNode()` — Submit form to create new listing
- `handleDeletePin()` — Remove user's own listing

**Marker Clustering:**
Uses Supercluster library to group nearby pins:
- At zoom 0-10: Show clusters of 10+ properties
- At zoom 11+: Show individual pins
- Cluster colors: Blue (most), Green (medium), Red (least density)

**Map Provider Support:**
```typescript
const mapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER; // 'google' or 'mapbox'

if (mapProvider === 'google') {
  // Use Google Maps with @vis.gl/react-google-maps
} else {
  // Use Mapbox with react-map-gl
}
```

Fallback: If primary provider fails, automatically switches to backup.

### 2. Add Property Form (AddPropertyForm.tsx)

**4-Step Form:**

| Step | Purpose | Fields |
|------|---------|--------|
| **1** | Location | Building name, verify on map |
| **2** | Building Details | Floor number, flat number |
| **3** | Rental Details | Rent, BHK, furnishing, deposit |
| **4** | Contact Info | Your name, email, phone (optional) |

**Form Features:**
- Reverse geocoding: Entering lat/lng shows locality name
- Building search: Auto-complete existing buildings
- Progress bar: Shows "Step 2 of 4"
- Validation: All required fields must be filled
- Error handling: Shows toast on submission failure
- Retry logic: Auto-retry after 2 seconds on timeout

**Submission Flow:**
```
User fills form
       ↓
Click "Submit"
       ↓
Client validation
       ↓
Call deployNode() server action
       ↓
Server: Check building exists
       ↓
Server: Call deploy_node_atomic() RPC
       ↓
Database: Create building, floor, flat in transaction
       ↓
Return success toast: "Property listed!"
       ↓
Close form, refresh map
```

### 3. Analytics Dashboard (AnalyticsDashboard.tsx)

**Displays:**
- **Live Stats:** Total listings, total seekers, avg rent, new listings today
- **Demand Heatmap:** Seeker pins visualized with intensity coloring
- **Top Areas:** Bar chart of areas with most seeker pins
- **BHK Distribution:** Pie chart of 1BHK vs 2BHK vs 3BHK demand
- **Coverage:** How many distinct areas have listings

**Data Source:**
```sql
SELECT 
  COUNT(DISTINCT buildings.id) as total_buildings,
  COUNT(DISTINCT flats.id) as total_flats,
  AVG(flats.rent_amount) as avg_rent,
  COUNT(DISTINCT seeker_pins.id) as total_seekers
FROM flats
CROSS JOIN seeker_pins
WHERE flats.city = 'Bengaluru'
  AND flats.status = 'vacant';
```

### 4. Metro Overlay (MetroOverlay.tsx)

**Features:**
- Displays metro stations as dots on map
- Draws polylines connecting stations
- Hover shows station name
- Click navigates to station

**Data:**
```typescript
const bengaluruMetro = [
  { name: 'Baiyappanahalli', lat: 12.9689, lng: 77.6499 },
  { name: 'MG Road', lat: 12.9757, lng: 77.6094 },
  { name: 'Cubbon Park', lat: 12.9793, lng: 77.5980 },
  // ... 45+ stations
];
```

**Rendering:**
- Google Maps: Uses `Marker` + `Polyline` from `@vis.gl/react-google-maps`
- Mapbox: Uses `Marker` + `Source`/`Layer` from `react-map-gl`

### 5. Legend (Legend.tsx)

**Shows:**
- Color coding: Blue pins (vacant), Gray (occupied), Red (old/stale)
- Filter tips: How to use budget slider, BHK filter
- Close button: Can be tapped 3 times before closing (with pop animation)

---

## API Reference

### Server Actions (Form Submission)

#### `deployNode(input: DeployNodeInput)`

**Purpose:** Create a new rental listing

**Input:**
```typescript
{
  latitude: number;           // Building location
  longitude: number;          // Building location
  societyName: string;        // Building name
  gatedCommunity: boolean;    // Is it gated?
  
  floorNumber: number;        // Which floor
  flatNumber: string;         // Flat number ("101", "A")
  
  rentAmount: number;         // Monthly rent in ₹
  bhk: number;                // 1, 2, 3, etc.
  sizeSquareFeet?: number;    // Carpet area
  furnished: 'unfurnished' | 'semi' | 'furnished';
  maintenanceExtra: boolean;  // Maintenance on top of rent?
  depositMonths: number;      // Security deposit
  petsAllowed: boolean;       // OK with pets?
  tenantPreference: 'bachelors' | 'families' | 'any';
  lookingForFlatmate: boolean; // Can they find flatmate?
  availableFrom?: string;     // Date
  
  contributorName: string;    // Your name
  contributorEmail: string;   // Your email
  contributorPhone: string;   // Your WhatsApp
}
```

**Output:**
```typescript
{
  flatId: string;             // UUID of created flat
  buildingId: string;         // UUID of building
  success: true;
}
```

**Error Handling:**
- `DeploymentError`: Building/floor creation failed
- `ValidationError`: Missing required fields
- `RateLimitError`: Too many submissions from same IP

#### `getSeekerPins()`

**Purpose:** Get all seeker demand pins in a city

**Output:**
```typescript
{
  pins: Array<{
    id: string;
    latitude: number;
    longitude: number;
    budget: number;
    bhkPreference: number;
    createdAt: string;
  }>;
}
```

#### `dropSeekerPin(input: DropSeekerPinInput)`

**Purpose:** Create a "looking for flat" pin

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  budget: number;
  bhkPreference: number;
  budget: number;
  tenantPreference: 'bachelors' | 'families' | 'any';
  contactEmail?: string;
}
```

---

## Map Engine Deep Dive

### Filtering Algorithm

User adjusts filters → Listings recalculated in real-time:

```typescript
function applyFilters() {
  const filtered = allFlats.filter(flat => {
    // Budget filter
    if (flat.rent_amount > maxBudget) return false;
    
    // BHK filter
    if (selectedBhk && flat.bhk !== selectedBhk) return false;
    
    // Furnishing filter
    if (selectedFurnish && flat.furnished !== selectedFurnish) return false;
    
    // Status filter
    if (!showOccupied && flat.status === 'occupied') return false;
    
    return true;
  });
  
  setFilteredPoints(filtered);
  // Re-cluster and re-render
}
```

**Performance:** Filters run on every state change, but are cached with `useMemo`:

```typescript
const filtered = useMemo(() => {
  // Heavy filtering logic
  return applyFilters();
}, [allFlats, budget, bhk, furnishing, status]);
```

### Clustering (Supercluster)

Groups nearby pins to reduce visual clutter:

```typescript
import Supercluster from 'supercluster';

const cluster = new Supercluster({
  radius: 80,           // Cluster within 80px radius
  maxZoom: 15,          // Stop clustering at zoom 15+
  minPoints: 2,         // Cluster 2+ points
});

cluster.load(points);   // Load all points

// On zoom/pan:
const clusters = cluster.getClusters(bounds, zoom);
// clusters = [
//   { clusterId: 1, latitude: 12.97, longitude: 77.60, count: 45 },
//   { id: 'flat-uuid', latitude: 12.98, longitude: 77.61 },
// ]
```

### Reverse Geocoding

When user drops a pin, we show the locality name:

```typescript
async function reverseGeocodeLocation(lat: number, lng: number) {
  const geocoder = new google.maps.Geocoder();
  
  const result = await geocoder.geocode({
    location: { lat, lng }
  });
  
  // Extract locality from address components
  const locality = result[0].address_components
    .find(c => c.types.includes('locality'))?.long_name;
  
  return locality; // "Whitefield", "Indiranagar", etc.
}
```

---

## Database Design

### Indexes for Performance

```sql
-- Geographic queries (nearest buildings)
CREATE INDEX buildings_location_idx ON buildings 
  USING gist (location);

-- City filtering
CREATE INDEX flats_city_idx ON flats 
  USING btree (city, status);

-- Seeker pins density queries
CREATE INDEX seeker_pins_location_idx ON seeker_pins 
  USING gist (location);

-- Recent listings
CREATE INDEX flats_created_idx ON flats 
  USING btree (created_at DESC);
```

### PostGIS Queries

**Find buildings within 100m of a point:**
```sql
SELECT id, name FROM buildings
WHERE ST_DWithin(
  location::geography, 
  ST_SetSRID(ST_Point(77.5946, 12.9716), 4326)::geography, 
  100  -- 100 meters
);
```

**Find density of seeker pins:**
```sql
SELECT 
  latitude, 
  longitude,
  COUNT(*) as pin_count
FROM seeker_pins
WHERE city = 'Bengaluru'
  AND created_at > now() - interval '30 days'
GROUP BY latitude, longitude
ORDER BY pin_count DESC;
```

### Row-Level Security Policies

**Users can only delete their own listings:**
```sql
CREATE POLICY "delete_own_flats" ON flats
  FOR DELETE USING (
    ip_hash = current_user_ip_hash  -- Custom context variable
  );
```

**Aggregate stats are public:**
```sql
CREATE POLICY "view_stats" ON flats
  FOR SELECT USING (true);  -- Anyone can see aggregates
```

---

## Performance & Caching

### Redis Caching Strategy

Expensive queries are cached:

```typescript
// Cache building list for 1 hour
const buildingsCache = await redis.get('buildings:all');

if (!buildingsCache) {
  const buildings = await supabase.from('buildings').select();
  await redis.set('buildings:all', JSON.stringify(buildings), 'EX', 3600);
} else {
  return JSON.parse(buildingsCache);
}
```

**What's Cached:**
- Building lists (updated when new building added)
- Seeker pin density (updated every 5 min)
- Analytics stats (updated every 10 min)

### Query Optimization

**N+1 Problem (Avoided):**
```typescript
// ❌ BAD: 1 query for buildings, then 1 per building for flats
const buildings = await supabase.from('buildings').select();
for (const b of buildings) {
  const flats = await supabase.from('flats').select().eq('building_id', b.id);
  // Total: N+1 queries
}

// ✅ GOOD: Single query with join
const flats = await supabase.from('flats')
  .select(`*, floors(*, buildings(*))`);
// Total: 1 query
```

**Pagination:**
For large result sets, use limit + offset:
```typescript
const page = 0;
const pageSize = 20;

const { data } = await supabase.from('flats')
  .select()
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

---

## Security & Privacy

### IP Hashing

Contributors' IPs are never stored directly:

```typescript
import { createHash } from 'crypto';

function hashIp(ip: string): string {
  return createHash('sha256')
    .update(ip + process.env.IP_SALT)  // Add salt for extra security
    .digest('hex')
    .substring(0, 16);  // Truncate for privacy
}
```

**Why?**
- Prevents tracking users across sessions
- Complies with GDPR
- Still allows us to rate-limit per IP

### Authentication

We use Supabase Auth with JWT:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});

// In server actions, get user:
const { data: { user } } = await supabase.auth.getUser();
```

### CORS Policy

API accepts requests only from:
- `localhost:3000` (dev)
- `indian.rent` (production)

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://indian.rent"
        }
      ]
    }
  ]
}
```

---

## Deployment & DevOps

### Environment Variables

**Frontend (Public):**
```
NEXT_PUBLIC_MAP_PROVIDER          # 'google' or 'mapbox'
NEXT_PUBLIC_SUPABASE_URL          # Database URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY   # Maps
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN   # Mapbox
```

**Backend (Secret):**
```
SUPABASE_SERVICE_ROLE_KEY         # Admin access (for server actions)
UPSTASH_REDIS_REST_URL            # Caching
UPSTASH_REDIS_REST_TOKEN
CRON_SECRET                        # For scheduled jobs
```

### Deployment Steps

1. **Push to Git**
   ```bash
   git add .
   git commit -m "feat: add metro overlay"
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel webhook triggers on push
   - Runs `npm run build`
   - Deploys to `indian.rent` domain

3. **Database Migrations**
   ```bash
   supabase db push  # Applies new migrations
   ```

### Monitoring

Check deployment status:
- **Build:** Vercel Dashboard → Deployments
- **Errors:** Vercel → Functions (serverless logs)
- **Database:** Supabase Dashboard → Logs
- **Performance:** Vercel → Web Analytics

---

## Troubleshooting Guide

### "Map doesn't load"

**Symptoms:** Blank map or "Map load failed" error

**Checklist:**
1. API keys set in `.env.local`?
2. API quotas exceeded? (Check Google Cloud Console)
3. Network tab shows 401/403 for map API?
4. Correct provider selected in env?

**Fix:**
```bash
# Verify keys
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Try fallback provider
# In RefinedMapEngine.tsx, temporarily set: 
const mapProvider = 'mapbox';
```

### "Form submission hangs"

**Symptoms:** Click submit, loading spinner never completes

**Cause:** Supabase cold-start on free tier

**Fix:**
1. Wait 10-30 seconds (database waking up)
2. Form has auto-retry — should succeed on next attempt
3. Add `SUPABASE_SERVICE_ROLE_KEY` to env to prevent cold-starts

### "Listings not showing on map"

**Symptoms:** "No Listings Yet" message even though data exists

**Possible Causes:**
1. **Filter too strict:** Adjust budget/BHK filters
2. **Wrong city:** Check env has correct city name
3. **Data in wrong building:** Buildings outside map bounds won't show
4. **Database query failed:** Check Network tab for errors

**Debug:**
```typescript
// In RefinedMapEngine console:
console.log('Filtered points:', filteredPoints.length);
console.log('All points:', allFlats.length);
console.log('Current filters:', { maxBudget, selectedBhk });
```

### "Mobile nav not appearing"

**Symptoms:** Bottom action buttons missing on phone

**Cause:** `lg:hidden` CSS being ignored

**Fix:**
1. Check viewport meta tag in `layout.tsx`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   ```

2. Test on actual device (not just browser DevTools)

3. Clear browser cache:
   ```bash
   # In browser DevTools
   DevTools → Storage → Clear site data
   ```

### "Seeker pins not showing on analytics"

**Symptoms:** Dashboard shows "0 seeker pins" but pins exist

**Debug:**
```sql
-- Check if pins exist
SELECT COUNT(*) FROM seeker_pins WHERE city = 'Bengaluru';

-- Check if they're recent
SELECT * FROM seeker_pins 
WHERE city = 'Bengaluru' 
  AND created_at > now() - interval '7 days'
LIMIT 5;
```

### "Duplicate properties appearing"

**Symptoms:** Same building listed twice

**Cause:** Building detection radius too large or name variations

**Fix:**
1. Increase `ST_DWithin` distance threshold:
   ```sql
   -- Check current duplicates
   SELECT name, ST_Distance(location, ...) as distance
   FROM buildings
   WHERE ST_DWithin(location, ..., 50);  -- 50m threshold
   ```

2. Merge duplicates manually via Supabase dashboard

---

## Advanced Topics

### Custom Hooks

**`useFilteredFlats`** — Get flats matching current filters
```typescript
const { flats, loading } = useFilteredFlats({
  maxBudget: 50000,
  bhk: 2,
  furnished: 'semi'
});
```

**`useSeekerPins`** — Get seeker demand pins
```typescript
const { pins, heatmapData } = useSeekerPins();
```

**`useReverseGeocode`** — Get location name from lat/lng
```typescript
const { locality, loading } = useReverseGeocode(lat, lng);
```

### Migration Example: Adding a New Field

**Step 1:** Create migration file
```sql
-- supabase/migrations/20260519_add_owner_phone.sql
ALTER TABLE flats ADD COLUMN owner_phone TEXT;
ALTER TABLE flats ADD CONSTRAINT phone_format 
  CHECK (owner_phone ~ '^\d{10}$');  -- India phone format
```

**Step 2:** Update TypeScript types
```typescript
// src/lib/types.ts
export interface Flat {
  // ... existing fields
  owner_phone?: string;
}
```

**Step 3:** Update form components
```typescript
// src/components/map/AddPropertyForm.tsx
<input type="tel" placeholder="10-digit phone" {...register('ownerPhone')} />
```

**Step 4:** Apply migration
```bash
supabase db push
npm run dev
```

---

## Getting Help

- **Questions?** Ask in GitHub Discussions
- **Found a bug?** Open an Issue with reproduction steps
- **Want to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Email:** hello@wishlabs.in

---

*Last updated: May 19, 2026*

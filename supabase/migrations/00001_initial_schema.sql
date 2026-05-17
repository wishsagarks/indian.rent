-- Enable PostGIS for mapping
CREATE EXTENSION IF NOT EXISTS postgis;

-- Buildings Table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('gated', 'semi-gated', 'standalone')),
    location GEOGRAPHY(POINT) NOT NULL,
    address TEXT,
    city TEXT DEFAULT 'Hyderabad',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Floors Table
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    UNIQUE(building_id, floor_number)
);

-- Flats Table
CREATE TABLE IF NOT EXISTS flats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
    flat_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('vacant', 'partial', 'occupied')),
    rent_amount NUMERIC,
    bhk INTEGER,
    furnishing TEXT CHECK (furnishing IN ('furnished', 'semi-furnished', 'unfurnished')),
    no_broker_link TEXT,
    flatmates_link TEXT,
    contributor_name TEXT, -- Anonymous metadata
    contributor_upi_id TEXT, -- For Good Faith Payouts
    intel_flags INTEGER DEFAULT 0, -- Tracking community reports
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (to extend Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    reward_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards Table (Peer-to-Peer)
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id), -- The contributor
    payer_id UUID REFERENCES auth.users(id),     -- The successful tenant
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'cleared', 'paid')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contributions Table (for verification & rewards)
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    flat_id UUID REFERENCES flats(id),
    contribution_type TEXT NOT NULL, -- 'new_listing', 'update_rent', 'verify_availability'
    is_verified BOOLEAN DEFAULT FALSE,
    reward_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a spatial index for faster map queries
CREATE INDEX IF NOT EXISTS buildings_location_idx ON buildings USING GIST (location);

-- Function to handle contribution verification (Incentive for good-faith peer-to-peer rewards)
CREATE OR REPLACE FUNCTION verify_contribution_reward()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
        -- Instead of automatic system payout, we log the reward eligibility 
        -- for the peer-to-peer transaction.
        INSERT INTO rewards (recipient_id, amount, status, description)
        VALUES (NEW.user_id, NEW.reward_amount, 'pending', 'Eligible for good-faith reward from future tenant');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contribution verification
DROP TRIGGER IF EXISTS on_contribution_verified ON contributions;
CREATE TRIGGER on_contribution_verified
    AFTER UPDATE ON contributions
    FOR EACH ROW
    WHEN (NEW.is_verified IS DISTINCT FROM OLD.is_verified)
    EXECUTE FUNCTION verify_contribution_reward();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_buildings_modtime ON buildings;
CREATE TRIGGER update_buildings_modtime BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_flats_modtime ON flats;
CREATE TRIGGER update_flats_modtime BEFORE UPDATE ON flats FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security (RLS)
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- 1. Buildings Policies (Anonymous Access)
DROP POLICY IF EXISTS "Public buildings are viewable by everyone" ON buildings;
CREATE POLICY "Public buildings are viewable by everyone" ON buildings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert buildings" ON buildings;
CREATE POLICY "Anyone can insert buildings" ON buildings FOR INSERT WITH CHECK (true);

-- 2. Floors Policies (Anonymous Access)
DROP POLICY IF EXISTS "Public floors are viewable by everyone" ON floors;
CREATE POLICY "Public floors are viewable by everyone" ON floors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert floors" ON floors;
CREATE POLICY "Anyone can insert floors" ON floors FOR INSERT WITH CHECK (true);

-- 3. Flats Policies (Anonymous Access)
DROP POLICY IF EXISTS "Active flats are viewable by everyone" ON flats;
CREATE POLICY "Active flats are viewable by everyone" ON flats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert flats" ON flats;
CREATE POLICY "Anyone can insert flats" ON flats FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update flats status" ON flats;
CREATE POLICY "Anyone can update flats status" ON flats FOR UPDATE USING (true);

-- 4. Profiles Policies (Anonymous Access)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert/update profile" ON profiles;
CREATE POLICY "Anyone can insert/update profile" ON profiles FOR INSERT WITH CHECK (true);

-- 5. Rewards Policies (Public View)
DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON rewards;
CREATE POLICY "Rewards are viewable by everyone" ON rewards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can log a reward" ON rewards;
CREATE POLICY "Anyone can log a reward" ON rewards FOR INSERT WITH CHECK (true);

-- 6. Contributions Policies (Anonymous Access)
DROP POLICY IF EXISTS "Contributions are viewable by everyone" ON contributions;
CREATE POLICY "Contributions are viewable by everyone" ON contributions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert contributions" ON contributions;
CREATE POLICY "Anyone can insert contributions" ON contributions FOR INSERT WITH CHECK (true);

-- Auth Trigger for Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC Function for Nearby Search
CREATE OR REPLACE FUNCTION get_nearby_buildings(t_lat FLOAT, t_lng FLOAT, t_radius FLOAT)
RETURNS SETOF buildings AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM buildings
    WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(t_lng, t_lat), 4326)::geography,
        t_radius
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Increment Flags RPC
CREATE OR REPLACE FUNCTION increment_intel_flags(target_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE flats
    SET intel_flags = intel_flags + 1
    WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;

-- Reversion Trigger for Fake Locks
CREATE OR REPLACE FUNCTION revert_on_flags()
RETURNS TRIGGER AS $$
BEGIN
    -- If flags reach 3, revert status to vacant and reset flags
    IF NEW.intel_flags >= 3 AND NEW.status = 'occupied' THEN
        NEW.status := 'vacant';
        NEW.intel_flags := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_flag_threshold_reached ON flats;
CREATE TRIGGER on_flag_threshold_reached
    BEFORE UPDATE ON flats
    FOR EACH ROW
    WHEN (OLD.intel_flags IS DISTINCT FROM NEW.intel_flags)
    EXECUTE FUNCTION revert_on_flags();

-- Extend buildings.category to include PG and Hostel listing types
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_category_check;
ALTER TABLE buildings ADD CONSTRAINT buildings_category_check
  CHECK (category IN ('gated', 'semi-gated', 'standalone', 'pg', 'hostel'));

-- Fix availability_date type mismatch in deploy_node_atomic
-- p_availability_date is TEXT but flats.availability_date is DATE — needs explicit cast

DROP FUNCTION IF EXISTS deploy_node_atomic(
  UUID, TEXT, TEXT, GEOMETRY, TEXT, TEXT, TEXT, INT, TEXT, FLOAT, TEXT, TEXT, TEXT, TEXT,
  INT, TEXT, INT, BOOLEAN, INT, TEXT, BOOLEAN, INT, BOOLEAN, TEXT, BOOLEAN
) CASCADE;

CREATE FUNCTION deploy_node_atomic(
  p_building_id UUID,
  p_building_name TEXT,
  p_category TEXT,
  p_location GEOMETRY,
  p_address TEXT,
  p_city TEXT,
  p_ip_hash TEXT,
  p_floor_number INT,
  p_flat_number TEXT,
  p_rent_amount FLOAT,
  p_no_broker_link TEXT,
  p_flatmates_link TEXT,
  p_contributor_name TEXT,
  p_contributor_upi_id TEXT,
  p_bhk INT,
  p_furnishing TEXT,
  p_size_sqft INT,
  p_maintenance_extra BOOLEAN,
  p_maintenance_amount INT,
  p_tenant_preference TEXT,
  p_pets_allowed BOOLEAN,
  p_deposit_months INT,
  p_is_transparency_pin BOOLEAN,
  p_availability_date TEXT,
  p_flatmate_needed BOOLEAN
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_building_id UUID;
  v_floor_id UUID;
  v_flat_id UUID;
BEGIN
  IF p_building_id IS NOT NULL THEN
    v_building_id := p_building_id;
  ELSE
    SELECT id INTO v_building_id FROM buildings
    WHERE name = p_building_name AND city = p_city
    LIMIT 1;

    IF v_building_id IS NULL THEN
      INSERT INTO buildings (name, category, location, address, city, ip_hash)
      VALUES (p_building_name, p_category, p_location, p_address, p_city, p_ip_hash)
      RETURNING id INTO v_building_id;
    END IF;
  END IF;

  INSERT INTO floors (building_id, floor_number)
  VALUES (v_building_id, p_floor_number)
  ON CONFLICT (building_id, floor_number) DO NOTHING
  RETURNING id INTO v_floor_id;

  IF v_floor_id IS NULL THEN
    SELECT id INTO v_floor_id FROM floors
    WHERE building_id = v_building_id AND floor_number = p_floor_number
    LIMIT 1;
  END IF;

  INSERT INTO flats (
    floor_id, flat_number, status, rent_amount, no_broker_link, flatmates_link,
    contributor_name, contributor_upi_id, bhk, furnishing, size_sqft,
    maintenance_extra, maintenance_amount, tenant_preference, pets_allowed,
    deposit_months, is_transparency_pin, availability_date, flatmate_needed, ip_hash
  )
  VALUES (
    v_floor_id, p_flat_number, 'vacant', p_rent_amount, p_no_broker_link, p_flatmates_link,
    p_contributor_name, p_contributor_upi_id, p_bhk, p_furnishing, p_size_sqft,
    p_maintenance_extra, p_maintenance_amount, p_tenant_preference, p_pets_allowed,
    p_deposit_months, p_is_transparency_pin,
    CASE WHEN p_availability_date IS NULL OR p_availability_date = '' THEN NULL ELSE p_availability_date::DATE END,
    p_flatmate_needed, p_ip_hash
  )
  RETURNING id INTO v_flat_id;

  INSERT INTO contributions (flat_id, contribution_type, reward_amount)
  VALUES (v_flat_id, 'new_listing', 2500);

  RETURN json_build_object('success', true, 'flat_id', v_flat_id);
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

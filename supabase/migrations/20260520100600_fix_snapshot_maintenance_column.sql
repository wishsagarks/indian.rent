/*
  Hotfix: Update refresh_map_snapshot() to use maintenance_extra instead of maintenance_included
*/

CREATE OR REPLACE FUNCTION refresh_map_snapshot()
RETURNS void AS $$
BEGIN
  DELETE FROM map_snapshot WHERE id = 1;

  INSERT INTO map_snapshot (id, data)
  SELECT
    1,
    COALESCE(jsonb_agg(row_to_json(b_row)), '[]'::jsonb)
  FROM (
    SELECT
      b.id,
      b.name,
      b.category,
      b.city,
      b.ip_hash AS building_ip_hash,
      jsonb_build_object(
        'type', 'Point',
        'coordinates', jsonb_build_array(
          ST_X(b.location::geometry),
          ST_Y(b.location::geometry)
        )
      ) AS location,
      b.updated_at,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', f.id,
              'floor_number', f.floor_number,
              'flats', COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', fl.id,
                      'flat_number', fl.flat_number,
                      'status', fl.status,
                      'rent_amount', fl.rent_amount,
                      'bhk', fl.bhk,
                      'furnishing', fl.furnishing,
                      'size_sqft', fl.size_sqft,
                      'maintenance_extra', fl.maintenance_extra,
                      'maintenance_amount', fl.maintenance_amount,
                      'tenant_preference', fl.tenant_preference,
                      'pets_allowed', fl.pets_allowed,
                      'deposit_months', fl.deposit_months,
                      'is_transparency_pin', fl.is_transparency_pin,
                      'availability_date', fl.availability_date,
                      'flatmate_needed', fl.flatmate_needed,
                      'contributor_name', fl.contributor_name,
                      'ip_hash', fl.ip_hash,
                      'updated_at', fl.updated_at
                    )
                  )
                  FROM flats fl
                  WHERE fl.floor_id = f.id AND fl.status != 'occupied' AND (fl.is_removed IS NULL OR fl.is_removed = false)
                ), '[]'::jsonb
              )
            )
          )
          FROM floors f
          WHERE f.building_id = b.id
        ), '[]'::jsonb
      ) AS floors
    FROM buildings b
    LIMIT 5000
  ) b_row;
END;
$$ LANGUAGE plpgsql;

import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    console.log('=== Diagnostic: Old Records ===\n');

    // Get total count
    const { count } = await supabase
      .from('flats')
      .select('*', { count: 'exact', head: true });

    console.log(`Total flats: ${count}`);

    // Get oldest records
    const { data: oldRecords, error: oldError } = await supabase
      .from('flats')
      .select('id, created_at, floor_id, flat_number, rent_amount, status')
      .order('created_at', { ascending: true })
      .limit(10);

    if (oldError) {
      return Response.json({ error: oldError.message }, { status: 500 });
    }

    console.log(`\nOldest ${oldRecords?.length} records:`);
    const oldestRecord = oldRecords?.[0];

    if (!oldestRecord) {
      return Response.json({ error: 'No records found' }, { status: 404 });
    }

    oldRecords?.forEach((r, i) => {
      console.log(`${i + 1}. ${r.id.substring(0, 8)}: floor_id=${r.floor_id ? 'set' : 'NULL'}, rent=${r.rent_amount}`);
    });

    // Try to fetch full details for oldest record
    console.log(`\nTrying to load full details for: ${oldestRecord.id.substring(0, 8)}...`);

    const { data: fullDetails, error: detailsError } = await supabase
      .from('flats')
      .select(`
        id, floor_id,
        floors (
          floor_number, building_id,
          buildings (id, name, city, address)
        )
      `)
      .eq('id', oldestRecord.id)
      .maybeSingle();

    if (detailsError) {
      console.log(`ERROR: ${detailsError.message}`);
    } else if (fullDetails) {
      console.log(`SUCCESS: Got details`);
      console.log(`- Has floor_id: ${fullDetails.floor_id ? 'YES' : 'NO'}`);
      const floorsArray = Array.isArray(fullDetails.floors) ? fullDetails.floors : [fullDetails.floors];
      console.log(`- Floor data: ${floorsArray && floorsArray.length > 0 ? 'YES' : 'NO'}`);
      if (floorsArray && floorsArray.length > 0 && floorsArray[0]) {
        console.log(`- Building data: ${(floorsArray[0] as any).buildings ? 'YES' : 'NO'}`);
      }
    } else {
      console.log(`NULL: Query returned no data`);
    }

    // Check for missing floor_id
    console.log(`\nChecking for records with missing floor_id...`);
    const { count: nullFloorCount } = await supabase
      .from('flats')
      .select('*', { count: 'exact', head: true })
      .is('floor_id', null);

    console.log(`Records with NULL floor_id: ${nullFloorCount}`);

    // Try to fetch oldest record WITHOUT the floor join
    console.log(`\nTrying to fetch oldest record WITHOUT floor join...`);
    const { data: directFlat, error: directError } = await supabase
      .from('flats')
      .select('id, flat_number, rent_amount, floor_id, created_at')
      .eq('id', oldestRecord.id)
      .maybeSingle();

    if (directError) {
      console.log(`ERROR: ${directError.message}`);
    } else if (directFlat) {
      console.log(`SUCCESS: Direct query works`);
      console.log(`Data: ${JSON.stringify(directFlat)}`);
    }

    return Response.json({
      totalRecords: count,
      oldestRecords: oldRecords?.map(r => ({
        id: r.id, // Full ID for testing
        created: r.created_at.substring(0, 10),
        floorId: r.floor_id ? 'set' : null,
        flatNumber: r.flat_number,
        rent: r.rent_amount
      })),
      diagnosticMessage: nullFloorCount && nullFloorCount > 0
        ? `⚠️ ${nullFloorCount} records have NULL floor_id - these cannot be loaded with the current query`
        : `✅ All records have floor_id references`,
      testOldestRecord: oldestRecord ? {
        id: oldestRecord.id.substring(0, 12),
        floorId: oldestRecord.floor_id ? 'set' : 'NULL',
        status: oldestRecord.floor_id ? 'Should load' : 'Will fail with join'
      } : null
    });

  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

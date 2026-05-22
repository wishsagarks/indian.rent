import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    console.log('\n=== DATA CLEANUP: Removing All Hyderabad Flats ===\n');

    // Find all buildings in Hyderabad
    const { data: buildings, error: buildingError } = await supabase
      .from('buildings')
      .select('id')
      .ilike('city', '%Hyderabad%');

    if (buildingError) {
      console.error('Error finding Hyderabad buildings:', buildingError.message);
      return Response.json({ error: buildingError.message }, { status: 500 });
    }

    const buildingIds = buildings?.map((b: any) => b.id) || [];
    console.log(`Found ${buildingIds.length} buildings in Hyderabad`);

    if (buildingIds.length === 0) {
      return Response.json({
        success: true,
        deleted: 0,
        message: 'No Hyderabad buildings found',
      });
    }

    // Find all floors in these buildings
    const { data: floors, error: floorError } = await supabase
      .from('floors')
      .select('id')
      .in('building_id', buildingIds);

    if (floorError) {
      console.error('Error finding floors:', floorError.message);
      return Response.json({ error: floorError.message }, { status: 500 });
    }

    const floorIds = floors?.map((f: any) => f.id) || [];
    console.log(`Found ${floorIds.length} floors in Hyderabad buildings`);

    // Find all flats in these floors
    const { data: flats, error: flatError } = await supabase
      .from('flats')
      .select('id')
      .in('floor_id', floorIds);

    if (flatError) {
      console.error('Error finding flats:', flatError.message);
      return Response.json({ error: flatError.message }, { status: 500 });
    }

    const flatIds = flats?.map((f: any) => f.id) || [];
    console.log(`Found ${flatIds.length} flats to delete`);

    // Delete all flats (cascade will handle ratings, comments, etc.)
    if (flatIds.length > 0) {
      console.log(`Deleting flats...`);
      for (const flatId of flatIds) {
        const { error: deleteError } = await supabase
          .from('flats')
          .delete()
          .eq('id', flatId);

        if (deleteError) {
          console.warn(`⚠️  Failed to delete ${flatId}: ${deleteError.message}`);
        }
      }
      console.log(`✅ Deleted ${flatIds.length} flats`);
    }

    // Summary
    console.log('\n=== CLEANUP SUMMARY ===');
    console.log(`Buildings in Hyderabad: ${buildingIds.length}`);
    console.log(`Floors removed: ${floorIds.length}`);
    console.log(`Flats deleted: ${flatIds.length}`);

    return Response.json({
      success: true,
      deleted: flatIds.length,
      buildings: buildingIds.length,
      floors: floorIds.length,
      message: `Cleaned up all Hyderabad data - deleted ${flatIds.length} flats from ${buildingIds.length} buildings`,
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

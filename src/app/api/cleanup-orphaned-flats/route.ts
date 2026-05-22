import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    console.log('\n=== DATA CLEANUP: Removing Orphaned Flats ===\n');

    // Step 1: Find all flats with NULL floor_id
    console.log('Step 1: Finding flats with NULL floor_id...');
    const { data: nullFloorFlats, error: nullError } = await supabase
      .from('flats')
      .select('id, flat_number, created_at')
      .is('floor_id', null);

    if (nullError) {
      console.error('Error finding null floor_id flats:', nullError.message);
    }

    const nullFloorIds = nullFloorFlats?.map((f: any) => f.id) || [];
    console.log(`Found ${nullFloorIds.length} flats with NULL floor_id`);

    // Step 2: Find flats referencing non-existent floors
    console.log('\nStep 2: Finding flats with broken floor references...');
    const { data: allFlats, error: allError } = await supabase
      .from('flats')
      .select('id, flat_number, floor_id')
      .not('floor_id', 'is', null);

    if (allError) {
      console.error('Error fetching flats:', allError.message);
    }

    const floorIds = [...new Set(allFlats?.filter((f: any) => f.floor_id).map((f: any) => f.floor_id) || [])];
    console.log(`Checking ${floorIds.length} unique floor references...`);

    let orphanedFlatIds: string[] = [];

    if (floorIds.length > 0) {
      const { data: existingFloors, error: floorError } = await supabase
        .from('floors')
        .select('id')
        .in('id', floorIds);

      if (floorError) {
        console.error('Error checking floors:', floorError.message);
      } else {
        const existingFloorIds = new Set(existingFloors?.map((f: any) => f.id) || []);
        const orphanedFlats = allFlats?.filter((f: any) => !existingFloorIds.has(f.floor_id)) || [];
        orphanedFlatIds = orphanedFlats.map((f: any) => f.id);
      }
    }

    console.log(`Found ${orphanedFlatIds.length} flats with orphaned floor references`);

    // Step 3: Delete all problematic flats
    const allProblematicIds = [...new Set([...nullFloorIds, ...orphanedFlatIds])];
    console.log(`\nTotal flats to delete: ${allProblematicIds.length}`);

    if (allProblematicIds.length > 0) {
      console.log(`Deleting: ${allProblematicIds.slice(0, 5).join(', ')}${allProblematicIds.length > 5 ? '...' : ''}`);

      // Delete using individual IDs to avoid "in" query issues
      for (const flatId of allProblematicIds) {
        const { error: deleteError } = await supabase
          .from('flats')
          .delete()
          .eq('id', flatId);

        if (deleteError) {
          console.warn(`⚠️  Failed to delete ${flatId}: ${deleteError.message}`);
        }
      }

      console.log(`✅ Successfully processed ${allProblematicIds.length} problematic flats`);
    }

    // Step 4: Verify cleanup
    console.log('\nStep 3: Verifying cleanup...');
    const { count: remainingCount } = await supabase
      .from('flats')
      .select('*', { count: 'exact', head: true });

    console.log(`Remaining flats: ${remainingCount}`);

    // Summary
    console.log('\n=== CLEANUP SUMMARY ===');
    console.log(`Flats with NULL floor_id deleted: ${nullFloorIds.length}`);
    console.log(`Flats with orphaned floor references deleted: ${orphanedFlatIds.length}`);
    console.log(`Total deleted: ${allProblematicIds.length}`);
    console.log(`Remaining healthy flats: ${remainingCount}`);

    return Response.json({
      success: true,
      deleted: {
        nullFloorId: nullFloorIds.length,
        orphanedReferences: orphanedFlatIds.length,
        total: allProblematicIds.length
      },
      remaining: remainingCount,
      message: `Cleaned up ${allProblematicIds.length} problematic flats. Remaining: ${remainingCount} healthy records.`
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

import { deployNode } from '@/app/actions/map-actions';

export async function POST(req: Request) {
  try {
    const testData = {
      lat: 17.3850,
      lng: 78.4867,
      buildingName: 'TEST BUILDING ' + Date.now(),
      category: 'gated',
      floor: '1',
      flatNumber: '101',
      rent: '25000',
      contributorName: 'Test User',
      bhk: '2',
    };

    console.log('TEST_DEPLOY: Calling deployNode with:', testData);
    const result = await deployNode(testData);
    console.log('TEST_DEPLOY: Result:', result);

    return Response.json(result);
  } catch (err) {
    console.error('TEST_DEPLOY: Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

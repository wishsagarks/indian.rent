import { getFlatDetails } from '@/app/actions/map-actions';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'No ID provided' }, { status: 400 });
    }

    const result = await getFlatDetails(id);
    return Response.json(result || { error: 'Not found' });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

/*
  # Enable Realtime on map_snapshot table

  This allows the frontend to subscribe to live updates when the map snapshot
  is refreshed (after new listings are deployed or flats are locked).

  1. Changes
    - Add map_snapshot to the Supabase Realtime publication
*/

ALTER PUBLICATION supabase_realtime ADD TABLE map_snapshot;

// The farm payload's path, in a file neither side owns.
//
// It used to live in lib/use-farm-data ('use client'), and importing it into
// the server component turned it into a client reference: the inline script
// shipped `fetch({})` and every reader got a 404 (23 Sep 2026).
export const FARM_DATA_URL = '/tools/leveling-spots/farm-data';

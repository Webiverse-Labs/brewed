export function hasCafeLocation(cafe) {
  const { lat, lng } = cafe.location ?? {};
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Tenants in the same building share a pin, without inventing separate street locations.
export function groupCafeLocations(cafes) {
  const groups = new Map();
  for (const cafe of cafes) {
    if (!hasCafeLocation(cafe)) continue;
    const key = `${cafe.location.lat},${cafe.location.lng}`;
    if (!groups.has(key)) groups.set(key, { location: cafe.location, cafes: [] });
    groups.get(key).cafes.push(cafe);
  }
  return [...groups.values()];
}

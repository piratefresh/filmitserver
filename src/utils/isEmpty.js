export function isEmpty(value) {
  console.log(value == null || value.length === 0 || !value);
  return value == null || value.length === 0;
}

export function isNotEmpty(value) {
  return value !== null || value.length !== 0;
}

export function validateLatLon(lat, lon) {
  return (lat == null || lat.length === 0) && (lon == null || lon.length === 0);
}

export function validateCategory(category) {
  return category.length > 0 && category && category.join("");
}

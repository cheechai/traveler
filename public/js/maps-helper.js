function buildMapsUrl(prefix) {
  const locInput = document.getElementById(
    prefix === 'new' ? 'new-location-name' : 'edit-location-' + prefix
  );
  const mapsInput = document.getElementById(
    prefix === 'new' ? 'new-maps-url' : 'edit-maps-' + prefix
  );
  if (!locInput || !locInput.value.trim()) {
    alert('Enter a location name first.');
    return;
  }
  mapsInput.value = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(locInput.value.trim());
}

function buildDirectionsUrl(origin, destination, mode) {
  mode = mode || 'driving';
  return 'https://www.google.com/maps/dir/?api=1&origin=' +
    encodeURIComponent(origin) +
    '&destination=' + encodeURIComponent(destination) +
    '&travelmode=' + mode;
}

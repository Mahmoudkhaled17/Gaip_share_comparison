import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

function FitBounds({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds || !Array.isArray(bounds) || bounds.length < 2) return;
    const [[lat1, lng1], [lat2, lng2]] = bounds;
    const latLngBounds = L.latLngBounds(
      [Math.min(lat1, lat2), Math.min(lng1, lng2)],
      [Math.max(lat1, lat2), Math.max(lng1, lng2)]
    );
    map.fitBounds(latLngBounds, { padding: [20, 20], maxZoom: 16, animate: true });
  }, [map, JSON.stringify(bounds)]);

  return null;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);

  return null;
}

export default function ViewerMap({
  yearTiles,
  selectedYear,
  activeLayer,
  opacity,
  bounds,
}) {
  const yearObj = selectedYear ? (yearTiles || {})[selectedYear] : null;
  const layerKey = activeLayer === 'crop_type' ? 'crop_type_tiles' : 'crop_health_tiles';
  const tileUrl = yearObj && yearObj.maps_urls ? yearObj.maps_urls[layerKey] : null;

  return (
    <MapContainer
      center={[26.8206, 30.8025]}
      zoom={6}
      minZoom={3}
      maxZoom={20}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Esri"
        maxZoom={20}
      />
      {tileUrl && (
        <TileLayer
          key={`${selectedYear}-${activeLayer}-${opacity}`}
          url={tileUrl}
          opacity={opacity}
        />
      )}
      <FitBounds bounds={bounds} />
      <MapResizer />
    </MapContainer>
  );
}

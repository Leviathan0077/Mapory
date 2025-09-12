import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Memory, MapViewport } from "../types";
import { DEFAULT_VIEWPORT } from "../lib/mapbox";

// Fix for default markers in Leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapProps {
  memories: Memory[];
  onMemoryClick?: (memory: Memory) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  selectedMemoryId?: string;
  viewport?: MapViewport;
  onViewportChange?: (viewport: MapViewport) => void;
}

const MapComponent: React.FC<MapProps> = ({
  memories,
  onMemoryClick,
  onMapClick,
  selectedMemoryId,
  viewport = DEFAULT_VIEWPORT,
  onViewportChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new globalThis.Map());

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (!mapContainer.current) return;

    // Wait for the container to be fully rendered
    setTimeout(() => {
      if (!mapContainer.current || map.current) return;

      // Check if container is already initialized
      if (mapContainer.current._leaflet_id) {
        return;
      }

      map.current = L.map(mapContainer.current).setView(
        [viewport.latitude, viewport.longitude],
        viewport.zoom
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map.current);

      // Handle map clicks
      map.current.on("click", (e) => {
        const coordinates: [number, number] = [e.latlng.lng, e.latlng.lat];
        onMapClick?.(coordinates);
      });

      // Handle viewport changes
      map.current.on("moveend", () => {
        if (map.current && onViewportChange) {
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          onViewportChange({
            latitude: center.lat,
            longitude: center.lng,
            zoom,
          });
        }
      });
    }, 100);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when memories change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker: L.Marker) => marker.remove());
    markers.current.clear();

    // Add new markers
    memories.forEach((memory) => {
      const el = document.createElement("div");
      el.className = "memory-marker";
      el.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: ${
          selectedMemoryId === memory.id ? "#ff6b6b" : "#4ecdc4"
        };
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
      `;
      el.textContent = "📷";

      const customIcon = L.divIcon({
        html: el.outerHTML,
        className: "custom-marker",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker(
        [memory.location.latitude, memory.location.longitude],
        {
          icon: customIcon,
        }
      ).addTo(map.current!);

      // Add click handler
      marker.on("click", () => {
        onMemoryClick?.(memory);
      });

      markers.current.set(memory.id, marker);
    });
  }, [memories, selectedMemoryId]);

  // Update map center when viewport changes
  useEffect(() => {
    if (map.current && viewport) {
      // Add a small delay to ensure map is fully initialized
      setTimeout(() => {
        if (map.current) {
          const currentCenter = map.current.getCenter();
          const currentZoom = map.current.getZoom();

          // Only update if the viewport actually changed
          if (
            Math.abs(currentCenter.lat - viewport.latitude) > 0.0001 ||
            Math.abs(currentCenter.lng - viewport.longitude) > 0.0001 ||
            Math.abs(currentZoom - viewport.zoom) > 0.1
          ) {
            map.current.setView(
              [viewport.latitude, viewport.longitude],
              viewport.zoom
            );
          }
        }
      }, 100);
    }
  }, [viewport.latitude, viewport.longitude, viewport.zoom]);

  return (
    <div className="map-container">
      <div
        ref={mapContainer}
        className="map"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default MapComponent;

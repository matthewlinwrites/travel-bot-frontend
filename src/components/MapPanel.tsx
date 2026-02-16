import { useState, useEffect, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Location } from "../types/chat";

interface Props {
  locationNames: string[];
  onClear?: () => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

function MapMarkers({ locationNames }: Props) {
  const map = useMap();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const geocodedRef = useRef<Set<string>>(new Set());

  const geocodeNames = useCallback(
    async (names: string[]) => {
      if (!map || names.length === 0) return;

      const geocoder = new google.maps.Geocoder();
      const newLocations: Location[] = [];

      for (const name of names) {
        if (geocodedRef.current.has(name)) continue;
        geocodedRef.current.add(name);

        try {
          const result = await geocoder.geocode({ address: name });
          if (result.results.length > 0) {
            const { lat, lng } = result.results[0].geometry.location;
            newLocations.push({ name, lat: lat(), lng: lng() });
          }
        } catch {
          // Skip failed geocode
        }
      }

      if (newLocations.length > 0) {
        setLocations((prev) => [...prev, ...newLocations]);
      }
    },
    [map]
  );

  // Reset when locationNames changes completely (thread switch)
  useEffect(() => {
    geocodedRef.current = new Set();
    setLocations([]);
    setSelectedLocation(null);
  }, [locationNames.length === 0 ? "empty" : locationNames[0]]);

  // Geocode new names
  useEffect(() => {
    const newNames = locationNames.filter(
      (n) => !geocodedRef.current.has(n)
    );
    if (newNames.length > 0) {
      geocodeNames(newNames);
    }
  }, [locationNames, geocodeNames]);

  // Fit bounds when locations change
  useEffect(() => {
    if (!map || locations.length === 0) return;

    if (locations.length === 1) {
      map.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
      map.setZoom(12);
    } else {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
      map.fitBounds(bounds, 60);
    }
  }, [map, locations]);

  return (
    <>
      {locations.map((loc, i) => (
        <AdvancedMarker
          key={loc.name}
          position={{ lat: loc.lat, lng: loc.lng }}
          onClick={() => setSelectedLocation(loc)}
          title={loc.name}
        >
          <Pin
            background="#4f46e5"
            glyphColor="#ffffff"
            borderColor="#3730a3"
            glyph={String(i + 1)}
          />
        </AdvancedMarker>
      ))}
      {selectedLocation && (
        <InfoWindow
          position={{
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
          }}
          onCloseClick={() => setSelectedLocation(null)}
        >
          <div className="font-medium text-gray-900">
            {selectedLocation.name}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function MapPanel({ locationNames, onClear }: Props) {
  if (!API_KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800 p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">Map not configured</p>
          <p className="text-sm">
            Add your Google Maps API key to{" "}
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
              frontend/.env
            </code>{" "}
            as{" "}
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
              VITE_GOOGLE_MAPS_API_KEY
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="relative h-full w-full">
        <Map
          defaultCenter={{ lat: 20, lng: 0 }}
          defaultZoom={2}
          mapId="travel-bot-map"
          className="h-full w-full"
        >
          <MapMarkers locationNames={locationNames} />
        </Map>
        {locationNames.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2 rounded-full shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear map
          </button>
        )}
      </div>
    </APIProvider>
  );
}

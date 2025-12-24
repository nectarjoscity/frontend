'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { isWithinGeofence, getCurrentLocation, watchLocation, clearLocationWatch } from '../../utils/geofencing';

// Create context to share location data
const LocationContext = createContext(null);

export const useLocation = () => useContext(LocationContext);

export default function GeofenceGuard({ children, onOutsideGeofence }) {
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking' | 'available' | 'unavailable'

  useEffect(() => {
    // Check location on mount (runs in background, doesn't block UI)
    const initLocation = async () => {
      try {
        const loc = await getCurrentLocation();

        if (loc.unavailable) {
          console.log('[Geofence] Location unavailable, continuing without location data');
          setLocationStatus('unavailable');
          return;
        }

        setLocation(loc);
        setLocationStatus('available');

        const within = isWithinGeofence(loc.latitude, loc.longitude);
        if (!within && onOutsideGeofence) {
          console.log('[Geofence] Device outside bounds (logged for analytics)');
          onOutsideGeofence(loc);
        }
      } catch (error) {
        console.log('[Geofence] Location check failed, continuing:', error);
        setLocationStatus('unavailable');
      }
    };

    initLocation();

    // Watch for location changes (continuous monitoring in background)
    const id = watchLocation(
      (loc) => {
        if (loc.unavailable) {
          setLocationStatus('unavailable');
          return;
        }

        setLocation(loc);
        setLocationStatus('available');

        const within = isWithinGeofence(loc.latitude, loc.longitude);
        if (!within && onOutsideGeofence) {
          onOutsideGeofence(loc);
        }
      },
      null
    );

    // Periodic check every 60 seconds
    const interval = setInterval(initLocation, 60000);

    return () => {
      if (id !== null) {
        clearLocationWatch(id);
      }
      clearInterval(interval);
    };
  }, [onOutsideGeofence]);

  // Provide location data to children via context
  const locationData = {
    location,
    locationStatus,
    latitude: location?.latitude || null,
    longitude: location?.longitude || null,
    accuracy: location?.accuracy || null,
  };

  // Always render children immediately - location check happens in background
  return (
    <LocationContext.Provider value={locationData}>
      {children}
    </LocationContext.Provider>
  );
}

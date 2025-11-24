'use client';

import { useEffect, useState } from 'react';
import { isWithinGeofence, getCurrentLocation, watchLocation, clearLocationWatch, checkWiFiConnection } from '../../utils/geofencing';
import { useTheme } from '../providers';

export default function GeofenceGuard({ children, onOutsideGeofence }) {
  const { colors, theme } = useTheme();
  const [isWithinBounds, setIsWithinBounds] = useState(null); // null = checking, true = inside, false = outside
  const [locationError, setLocationError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [location, setLocation] = useState(null);
  const [checkInterval, setCheckInterval] = useState(null);

  useEffect(() => {
    // Check location on mount
    checkLocation();

    // Watch for location changes (continuous monitoring)
    const id = watchLocation(
      (loc) => {
        setLocation(loc);
        const within = isWithinGeofence(loc.latitude, loc.longitude);
        setIsWithinBounds(within);
        
        if (!within) {
          console.warn('[Geofence] Device moved outside restaurant bounds');
          if (onOutsideGeofence) {
            onOutsideGeofence(loc);
          }
        }
      },
      (error) => {
        console.error('[Geofence] Location watch error:', error);
        // Try WiFi fallback
        const onWiFi = checkWiFiConnection();
        if (onWiFi === true) {
          console.log('[Geofence] Using WiFi fallback - device on WiFi, allowing usage');
          setIsWithinBounds(true);
          setLocationError(null);
        } else {
          setLocationError(error.message);
          // Allow usage if location can't be determined (graceful degradation)
          setIsWithinBounds(true);
        }
      }
    );

    setWatchId(id);

    // Also check periodically (every 30 seconds) as backup
    const interval = setInterval(() => {
      checkLocation();
    }, 30000);

    setCheckInterval(interval);

    return () => {
      if (id !== null) {
        clearLocationWatch(id);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const checkLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      const within = isWithinGeofence(loc.latitude, loc.longitude);
      setIsWithinBounds(within);
      
      if (!within) {
        console.warn('[Geofence] Device is outside restaurant bounds');
        if (onOutsideGeofence) {
          onOutsideGeofence(loc);
        }
      } else {
        setLocationError(null);
      }
    } catch (error) {
      console.error('[Geofence] Error getting location:', error);
      
      // Try WiFi fallback
      const onWiFi = checkWiFiConnection();
      if (onWiFi === true) {
        console.log('[Geofence] Using WiFi fallback - device on WiFi, allowing usage');
        setIsWithinBounds(true);
        setLocationError(null);
      } else {
        setLocationError(error.message);
        // Allow usage if location can't be determined (graceful degradation)
        setIsWithinBounds(true);
      }
    }
  };

  // Show blocking screen if outside geofence
  if (isWithinBounds === false) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="text-center p-8 rounded-xl max-w-md mx-4" style={{ background: theme === 'light' ? '#1F2937' : '#111827', color: '#fff', border: '2px solid #EF4444' }}>
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-4">Device Outside Restaurant</h2>
          <p className="text-lg mb-4">
            This tablet must remain within the restaurant premises to function.
          </p>
          <p className="text-sm opacity-75 mb-6">
            Please return the device to the restaurant location.
          </p>
          {location && (
            <div className="text-xs opacity-60 mt-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <p>Current Location:</p>
              <p>Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}</p>
            </div>
          )}
          <button
            onClick={checkLocation}
            className="mt-4 px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105"
            style={{ background: colors.amber500, color: '#fff' }}
          >
            Check Location Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading while checking
  if (isWithinBounds === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="text-center p-8 rounded-xl" style={{ background: theme === 'light' ? '#1F2937' : '#111827', color: '#fff' }}>
          <div className="text-4xl mb-4 animate-pulse">📍</div>
          <p className="text-lg mb-2">Verifying location...</p>
          <p className="text-sm opacity-75">Please allow location access if prompted</p>
        </div>
      </div>
    );
  }

  // Show warning if location error but allow usage (graceful degradation)
  if (locationError && isWithinBounds === true) {
    // Don't block, just log - device can still be used
    console.warn('[Geofence] Location check failed, allowing usage:', locationError);
  }

  return children;
}


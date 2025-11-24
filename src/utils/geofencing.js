// Geofencing utility for restaurant tables

// Load restaurant location from localStorage or use default
function loadRestaurantLocation() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('restaurant_geofence');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored geofence:', e);
      }
    }
  }
  // Default location (should be set by admin)
  return {
    latitude: null,
    longitude: null,
    radius: 50 // Default radius in meters (50m = ~164 feet)
  };
}

// Get current restaurant location
export function getRestaurantLocation() {
  return loadRestaurantLocation();
}

// Set restaurant location (should be stored in backend/database in production)
export function setRestaurantLocation(latitude, longitude, radius = 50) {
  const location = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    radius: parseFloat(radius)
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('restaurant_geofence', JSON.stringify(location));
  }
  
  return location;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Check if location is within geofence
export function isWithinGeofence(latitude, longitude) {
  const restaurant = loadRestaurantLocation();
  
  // If restaurant location not set, allow usage (graceful degradation)
  if (!restaurant.latitude || !restaurant.longitude) {
    console.warn('[Geofence] Restaurant location not configured, allowing usage');
    return true;
  }

  const distance = calculateDistance(
    restaurant.latitude,
    restaurant.longitude,
    latitude,
    longitude
  );
  
  const within = distance <= restaurant.radius;
  
  console.log('[Geofence] Location check:', {
    restaurant: { lat: restaurant.latitude, lon: restaurant.longitude },
    device: { lat: latitude, lon: longitude },
    distance: distance.toFixed(2) + 'm',
    radius: restaurant.radius + 'm',
    within
  });
  
  return within;
}

// Get current location
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unknown error';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Watch location changes
export function watchLocation(onLocationUpdate, onError) {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    if (onError) {
      onError(new Error('Geolocation is not supported'));
    }
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      onLocationUpdate(location);
    },
    (error) => {
      if (onError) {
        let errorMessage = 'Unknown error';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }
        onError(new Error(errorMessage));
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache for 1 minute
    }
  );

  return watchId;
}

// Stop watching location
export function clearLocationWatch(watchId) {
  if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

// Check if device is on restaurant WiFi (fallback method)
export function checkWiFiConnection() {
  if (typeof window === 'undefined' || !navigator.connection) {
    return null; // Not supported
  }
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection && connection.type === 'wifi') {
    return true;
  }
  
  return false;
}


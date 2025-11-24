// Pre-order utility functions

// Load pre-order settings from localStorage
function loadPreOrderSettings() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preorder_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing pre-order settings:', e);
      }
    }
  }
  // Default settings
  return {
    enabled: false,
    startTime: '00:00', // 24-hour format HH:mm
    endTime: '23:59',   // 24-hour format HH:mm
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // All days by default (0 = Sunday, 6 = Saturday)
  };
}

// Get pre-order settings
export function getPreOrderSettings() {
  return loadPreOrderSettings();
}

// Set pre-order settings
export function setPreOrderSettings(settings) {
  const preOrderSettings = {
    enabled: settings.enabled !== undefined ? settings.enabled : false,
    startTime: settings.startTime || '00:00',
    endTime: settings.endTime || '23:59',
    daysOfWeek: settings.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('preorder_settings', JSON.stringify(preOrderSettings));
  }
  
  return preOrderSettings;
}

// Check if pre-orders are currently allowed
export function isPreOrderAllowed() {
  const settings = loadPreOrderSettings();
  
  // If pre-orders are disabled, return false
  if (!settings.enabled) {
    return false;
  }
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
  
  // Check if current day is in allowed days
  if (!settings.daysOfWeek.includes(currentDay)) {
    return false;
  }
  
  // Parse start and end times
  const [startHour, startMin] = settings.startTime.split(':').map(Number);
  const [endHour, endMin] = settings.endTime.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  // Handle case where end time is next day (e.g., 23:00 to 02:00)
  if (endTime < startTime) {
    // Time window spans midnight
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    // Normal time window
    return currentTime >= startTime && currentTime <= endTime;
  }
}

// Get time until pre-orders start (in milliseconds)
export function getTimeUntilPreOrderStart() {
  const settings = loadPreOrderSettings();
  
  if (!settings.enabled) {
    return null;
  }
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = settings.startTime.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  
  // Find next allowed day
  let daysToAdd = 0;
  let targetDay = currentDay;
  
  // Check if today is allowed and if we're before start time
  if (settings.daysOfWeek.includes(currentDay) && currentTime < startTime) {
    daysToAdd = 0;
  } else {
    // Find next allowed day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      if (settings.daysOfWeek.includes(nextDay)) {
        daysToAdd = i;
        targetDay = nextDay;
        break;
      }
    }
  }
  
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  targetDate.setHours(startHour, startMin, 0, 0);
  
  // If we're adding days, we want the start time of that day
  // If we're on the same day, we want today's start time
  if (daysToAdd === 0 && currentTime >= startTime) {
    // Already past start time today, find next day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      if (settings.daysOfWeek.includes(nextDay)) {
        targetDate.setDate(targetDate.getDate() + i);
        break;
      }
    }
  }
  
  return targetDate.getTime() - now.getTime();
}

// Get time until pre-orders end (in milliseconds)
export function getTimeUntilPreOrderEnd() {
  const settings = loadPreOrderSettings();
  
  if (!settings.enabled) {
    return null;
  }
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [endHour, endMin] = settings.endTime.split(':').map(Number);
  const endTime = endHour * 60 + endMin;
  
  // If we're within the time window, calculate time until end
  if (isPreOrderAllowed()) {
    const endDate = new Date(now);
    endDate.setHours(endHour, endMin, 0, 0);
    
    // If end time is earlier than current time, it means it's tomorrow
    if (endTime < currentTime) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    return endDate.getTime() - now.getTime();
  }
  
  return null;
}

// Format time remaining
export function formatTimeRemaining(ms) {
  if (!ms || ms <= 0) return '0 minutes';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}


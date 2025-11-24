// Notification and sound utility functions

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Play notification sound using Web Audio API
export const playNotificationSound = async () => {
  try {
    // Initialize or get existing audio context
    let audioContext = window.audioContext;
    
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      window.audioContext = audioContext;
    }
    
    // Resume audio context if suspended (required by browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Wait a bit to ensure context is ready
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Create a more noticeable beep sound
    const playBeep = (frequency, startTime, duration = 0.3) => {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Louder volume - start at 0.8
        gainNode.gain.setValueAtTime(0.8, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      } catch (err) {
        console.error('Error playing beep:', err);
      }
    };
    
    const now = audioContext.currentTime;
    
    // Play first beep (lower pitch)
    playBeep(600, now, 0.3);
    
    // Play second beep after a short delay (higher pitch)
    playBeep(800, now + 0.4, 0.3);
    
    // Play third beep for extra attention (even higher)
    playBeep(1000, now + 0.8, 0.3);
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Try alternative method
    playNotificationSoundAlternative();
  }
};

// Alternative sound method using buffer
export const playNotificationSoundAlternative = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playTone = (freq, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    };
    
    // Resume if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        playTone(600, 0.3);
        setTimeout(() => playTone(800, 0.3), 400);
        setTimeout(() => playTone(1000, 0.3), 800);
      });
    } else {
      playTone(600, 0.3);
      setTimeout(() => playTone(800, 0.3), 400);
      setTimeout(() => playTone(1000, 0.3), 800);
    }
  } catch (error) {
    console.error('Error with alternative sound method:', error);
  }
};

// Show browser notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click to focus window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
};

// Combined notification with sound
export const notifyWithSound = async (title, options = {}) => {
  // Play sound (await to ensure it plays)
  await playNotificationSound();
  
  // Show notification if permission granted
  if (await requestNotificationPermission()) {
    showNotification(title, options);
  }
};


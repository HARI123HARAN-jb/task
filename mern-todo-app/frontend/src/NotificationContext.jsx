import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

// Default settings
const defaultSettings = {
  sound: true,
  browser: false,
  mute: false
};

// Sound file (simple beep)
const NOTIF_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae1b2.mp3'; // royalty-free notification sound

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]); // { id, message, groupId, onClick }
  const [settings, setSettings] = useState(() => {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem('notifSettings') || '{}') };
    } catch {
      return defaultSettings;
    }
  });
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notifHistory') || '[]');
    } catch {
      return [];
    }
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem('notifSettings', JSON.stringify(settings));
  }, [settings]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('notifHistory', JSON.stringify(history));
  }, [history]);

  // Show a notification
  const notify = useCallback((message, options = {}) => {
    if (settings.mute) return;
    const id = Date.now() + Math.random();
    setNotifications((prev) => [
      ...prev,
      { id, message, ...options }
    ]);
    // Add to history
    setHistory((prev) => [
      { id, message, timestamp: new Date().toISOString(), ...options },
      ...prev
    ].slice(0, 50)); // Keep last 50
    // Play sound if enabled
    if (settings.sound) {
      const audio = new window.Audio(NOTIF_SOUND_URL);
      audio.play();
    }
    // Browser notification if enabled
    if (settings.browser && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Taskflow', { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Taskflow', { body: message });
          }
        });
      }
    }
    // Auto-dismiss after 5s
    setTimeout(() => {
      setNotifications((prev) => prev.filter(n => n.id !== id));
    }, 5000);
  }, [settings]);

  // Remove a notification manually
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  // Update settings
  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Clear notification history
  const clearHistory = () => setHistory([]);

  return (
    <NotificationContext.Provider value={{ notify, notifications, removeNotification, settings, updateSettings, history, clearHistory }}>
      {children}
    </NotificationContext.Provider>
  );
} 
import React from 'react';
import { useNotification } from './NotificationContext';

function NotificationSettingsPage() {
  const { settings, updateSettings, history, clearHistory } = useNotification();

  // Request browser notification permission
  const handleBrowserToggle = async (e) => {
    const enabled = e.target.checked;
    if (enabled && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }
    updateSettings({ browser: enabled });
  };

  // Helper to format timestamp
  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h2 className="mb-4">Notification Settings</h2>
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="notifSound"
          checked={settings.sound}
          onChange={e => updateSettings({ sound: e.target.checked })}
          disabled={settings.mute}
        />
        <label className="form-check-label" htmlFor="notifSound">
          Sound Notifications
        </label>
      </div>
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="notifBrowser"
          checked={settings.browser}
          onChange={handleBrowserToggle}
          disabled={settings.mute}
        />
        <label className="form-check-label" htmlFor="notifBrowser">
          Browser Push Notifications
        </label>
      </div>
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="notifMute"
          checked={settings.mute}
          onChange={e => updateSettings({ mute: e.target.checked })}
        />
        <label className="form-check-label" htmlFor="notifMute">
          Mute All Notifications
        </label>
      </div>
      <div className="alert alert-info mt-4">
        <strong>Tip:</strong> You can always change these settings here. Browser notifications require permission from your browser.
      </div>

      <hr className="my-4" />
      <h4 className="mb-3">Notification History</h4>
      {history.length === 0 ? (
        <div className="text-muted">No notifications yet.</div>
      ) : (
        <>
          <button className="btn btn-sm btn-outline-danger mb-2" onClick={clearHistory}>Clear History</button>
          <ul className="list-group mb-4">
            {history.map(n => (
              <li key={n.id} className="list-group-item d-flex flex-column align-items-start">
                <span style={{ fontSize: 15 }}>{n.message}</span>
                <span className="text-muted small">{formatTime(n.timestamp)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default NotificationSettingsPage; 
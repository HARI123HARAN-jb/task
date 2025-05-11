import React from 'react';
import { useNotification } from '../NotificationContext';

function NotificationPopup() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 12
    }}>
      {notifications.map(n => (
        <div
          key={n.id}
          className="alert alert-info shadow-sm d-flex align-items-center"
          style={{ minWidth: 280, maxWidth: 360, cursor: n.onClick ? 'pointer' : 'default', marginBottom: 0 }}
          onClick={() => {
            if (n.onClick) n.onClick();
            removeNotification(n.id);
          }}
        >
          <span className="me-2">🔔</span>
          <span>{n.message}</span>
        </div>
      ))}
    </div>
  );
}

export default NotificationPopup; 
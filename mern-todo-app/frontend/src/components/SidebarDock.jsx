import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Simple SVG icons for each feature
function SidebarDock({ isAdmin }) {
  const location = useLocation();
  const navItems = [
    {
      to: '/chat',
      icon: (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      ),
      label: 'Chat',
      show: true,
    },
    {
      to: '/group-chat',
      icon: (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><circle cx="17" cy="17" r="4"/><path d="M17 13v4h4"/></svg>
      ),
      label: 'Group Chat',
      show: true,
    },
    {
      to: '/my-teams',
      icon: (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
      ),
      label: 'My Teams',
      show: true,
    },
    {
      to: '/admin/users',
      icon: (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
      ),
      label: 'Manage Users',
      show: isAdmin,
    },
    {
      to: '/admin/teams',
      icon: (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
      ),
      label: 'Manage Teams',
      show: isAdmin,
    },
    // Notification Settings
    {
      to: '/settings',
      icon: (
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      ),
      label: 'Notification Settings',
      show: true,
    },
  ];

  // Handler for the plus button
  const handlePlusClick = () => {
    alert('Add new app/integration (coming soon)!');
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 64,
        height: '100vh',
        background: 'linear-gradient(180deg, #23243a 60%, #3a3b5a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 24,
        zIndex: 3000,
        boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
      }}
    >
      {navItems.filter(item => item.show).map(item => (
        <Link
          key={item.to}
          to={item.to}
          style={{
            margin: '18px 0',
            color: location.pathname.startsWith(item.to) ? '#6f6fff' : '#fff',
            background: location.pathname.startsWith(item.to) ? 'rgba(111,111,255,0.12)' : 'none',
            borderRadius: 12,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition: 'background 0.18s',
            position: 'relative',
          }}
          title={item.label}
        >
          {item.icon}
          {/* Tooltip on hover */}
          <span
            style={{
              position: 'absolute',
              left: 56,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#23243a',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 14,
              whiteSpace: 'nowrap',
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.18s',
            }}
            className="sidebar-tooltip"
          >
            {item.label}
          </span>
        </Link>
      ))}
      {/* Add a little space at the bottom */}
      <div style={{ flex: 1 }} />
      {/* Plus (+) button for adding integrations/apps */}
      <button
        onClick={handlePlusClick}
        style={{
          margin: '18px 0 24px 0',
          color: '#fff',
          background: 'rgba(111,111,255,0.18)',
          border: 'none',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(111,111,255,0.08)',
          transition: 'background 0.18s',
          position: 'relative',
        }}
        title="Add App/Integration"
      >
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="14" y1="6" x2="14" y2="22"/><line x1="6" y1="14" x2="22" y2="14"/></svg>
        {/* Tooltip on hover */}
        <span
          style={{
            position: 'absolute',
            left: 56,
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#23243a',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 14,
            whiteSpace: 'nowrap',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.18s',
          }}
          className="sidebar-tooltip"
        >
          Add App/Integration
        </span>
      </button>
    </nav>
  );
}

export default SidebarDock; 
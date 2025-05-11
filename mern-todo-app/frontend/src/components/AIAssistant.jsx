import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../UserContext';
import axios from 'axios';

// Simple robot icon SVG
const RobotIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="12" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/></svg>
);

const AIAssistant = () => {
  const { isAdmin, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! I am your Gemini AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // Scroll to bottom when new message
  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (!isAdmin || !user) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { sender: 'user', text: input }]);
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:5000/api/ai/gemini', { message: input });
      setMessages((msgs) => [...msgs, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { sender: 'ai', text: 'Sorry, I could not process your request.' }]);
      setError('AI service error.');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  // Floating ball button style
  const ballStyle = {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6f6fff 60%, #00c6ff 100%)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 2000,
    color: '#fff',
    border: 'none',
    outline: 'none',
    transition: 'box-shadow 0.2s',
  };

  // Chat modal style
  const modalStyle = {
    position: 'fixed',
    bottom: '110px',
    right: '32px',
    width: '350px',
    maxWidth: '95vw',
    height: '480px',
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
    zIndex: 2100,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #6f6fff 60%, #00c6ff 100%)',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const chatBodyStyle = {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    background: '#f7f8fa',
  };

  const inputBarStyle = {
    display: 'flex',
    borderTop: '1px solid #eee',
    padding: '8px',
    background: '#fff',
  };

  const messageStyle = (sender) => ({
    alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
    background: sender === 'user' ? '#6f6fff' : '#e6e8f3',
    color: sender === 'user' ? '#fff' : '#222',
    borderRadius: '16px',
    padding: '8px 14px',
    margin: '4px 0',
    maxWidth: '80%',
    fontSize: '1rem',
    boxShadow: sender === 'user' ? '0 2px 8px rgba(111,111,255,0.08)' : 'none',
  });

  return (
    <>
      {/* Floating Ball Button */}
      {!open && (
        <button style={ballStyle} title="AI Assistant" onClick={() => setOpen(true)}>
          <RobotIcon />
        </button>
      )}
      {/* Chat Modal */}
      {open && (
        <div style={modalStyle}>
          <div style={headerStyle}>
            <span style={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              <RobotIcon />
              <span style={{ marginLeft: 8 }}>Gemini AI Assistant</span>
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
              title="Close"
            >
              ×
            </button>
          </div>
          <div style={chatBodyStyle}>
            {messages.map((msg, idx) => (
              <div key={idx} style={messageStyle(msg.sender)}>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form style={inputBarStyle} onSubmit={handleSend}>
            <input
              type="text"
              className="form-control"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1, marginRight: 8 }}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
          {/* Placeholder for Meeting Option */}
          <div style={{ padding: '8px', borderTop: '1px solid #eee', background: '#f7f8fa', textAlign: 'center' }}>
            <button className="btn btn-outline-info btn-sm" disabled title="Coming soon!">
              📅 Schedule Meeting (coming soon)
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant; 
import React, { useState } from 'react';
import { useAuth } from './UserContext';

function UserChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { sender: 'system', text: 'Welcome to the chat! Start a conversation.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: user.username, text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      // Placeholder: Call backend chat API endpoint (to be implemented)
      // const res = await fetch('/api/chat/send', ...);
      // const data = await res.json();
      // setMessages(msgs => [...msgs, { sender: data.sender, text: data.text }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { sender: 'system', text: 'Error sending message.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) sendMessage();
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-3">User/Admin Chat</h2>
      <div className="border rounded p-3 mb-3 bg-light" style={{ minHeight: 300, maxHeight: 400, overflowY: 'auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.sender === 'system' ? 'text-secondary' : (msg.sender === user.username ? 'text-success' : 'text-primary')}`}> 
            <strong>{msg.sender === 'system' ? 'System' : msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default UserChatPage; 
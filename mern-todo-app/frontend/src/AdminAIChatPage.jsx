import React, { useState } from 'react';

function AdminAIChatPage() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello Admin! I am Gemini AI. How can I help you with your tasks today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'admin', text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      // Placeholder: Call backend Gemini API endpoint
      const res = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { sender: 'ai', text: data.reply || 'Sorry, I could not process that.' }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { sender: 'ai', text: 'Error contacting Gemini AI.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) sendMessage();
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-3">Gemini AI Assistant (Admin Only)</h2>
      <div className="border rounded p-3 mb-3 bg-light" style={{ minHeight: 300, maxHeight: 400, overflowY: 'auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.sender === 'ai' ? 'text-primary' : 'text-success'}`}> 
            <strong>{msg.sender === 'ai' ? 'Gemini AI' : 'You'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Ask Gemini AI to do something..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button className="btn btn-info" onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default AdminAIChatPage; 
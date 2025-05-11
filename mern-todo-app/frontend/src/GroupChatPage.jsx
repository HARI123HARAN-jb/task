import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './UserContext';
import { useNotification } from './NotificationContext';

const API_URL = 'http://localhost:5000';

function GroupChatPage() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [notif, setNotif] = useState('');
  const [unread, setUnread] = useState({}); // { groupId: count }
  const chatEndRef = useRef(null);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/groups`);
        setGroups(res.data);
      } catch (e) {
        setNotif('Failed to load groups');
      }
    };
    fetchGroups();
  }, []);

  // Fetch messages when group changes
  useEffect(() => {
    if (!selectedGroup) return;
    let isMounted = true;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/chat/group/${selectedGroup._id}`);
        if (isMounted) setMessages(res.data);
        // Mark as read
        setUnread(prev => ({ ...prev, [selectedGroup._id]: 0 }));
      } catch (e) {
        setNotif('Failed to load messages');
      }
    };
    fetchMessages();
    // Poll for new messages every 5s
    const interval = setInterval(fetchMessages, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [selectedGroup]);

  // Fetch all users for group creation
  useEffect(() => {
    if (!showCreateModal) return;
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/users`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAllUsers(res.data.filter(u => u._id !== user._id));
      } catch (e) {
        setNotif('Failed to load users');
      }
    };
    fetchUsers();
  }, [showCreateModal, user._id, user.token]);

  // Track unread messages per group
  useEffect(() => {
    if (!selectedGroup) return;
    // When a new message arrives for a group not selected, increment unread
    const pollUnread = async () => {
      for (const group of groups) {
        if (!selectedGroup || group._id !== selectedGroup._id) {
          try {
            const res = await axios.get(`${API_URL}/api/chat/group/${group._id}`);
            setUnread(prev => ({ ...prev, [group._id]: res.data.length }));
          } catch {}
        }
      }
    };
    const interval = setInterval(pollUnread, 10000);
    return () => clearInterval(interval);
  }, [groups, selectedGroup]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Poll for new messages in all groups and notify if new message arrives in a group not being viewed
  useEffect(() => {
    if (!user || !groups.length) return;
    let prevCounts = {};
    const pollAllGroups = async () => {
      for (const group of groups) {
        try {
          const res = await axios.get(`${API_URL}/api/chat/group/${group._id}`);
          const count = res.data.length;
          if (
            group._id !== (selectedGroup && selectedGroup._id) &&
            prevCounts[group._id] !== undefined &&
            count > prevCounts[group._id]
          ) {
            // Find the new message
            const newMsg = res.data[res.data.length - 1];
            if (newMsg && newMsg.sender !== user._id) {
              notify(
                `New message in ${group.name}: ${newMsg.content.slice(0, 60)}`,
                {
                  groupId: group._id,
                  onClick: () => {
                    setSelectedGroup(group);
                  }
                }
              );
            }
          }
          prevCounts[group._id] = count;
        } catch {}
      }
    };
    const interval = setInterval(pollAllGroups, 5000);
    return () => clearInterval(interval);
  }, [groups, selectedGroup, user, notify]);

  const handleSend = async () => {
    if (!input.trim() || !selectedGroup) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/chat/group/${selectedGroup._id}/send`, { content: input });
      setInput('');
      // Refresh messages
      const res = await axios.get(`${API_URL}/api/chat/group/${selectedGroup._id}`);
      setMessages(res.data);
    } catch (e) {
      setNotif('Failed to send message');
    }
    setLoading(false);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedMembers.length === 0) return;
    try {
      await axios.post(`${API_URL}/api/groups`, {
        name: newGroupName,
        members: selectedMembers
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setSelectedMembers([]);
      // Refresh group list
      const res = await axios.get(`${API_URL}/api/groups`);
      setGroups(res.data);
      setNotif('Group created!');
    } catch (e) {
      setNotif('Failed to create group');
    }
  };

  // Helper: Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Helper: Format timestamp
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container-fluid" style={{ height: '80vh', maxHeight: 700 }}>
      <div className="row h-100">
        {/* Sidebar: Group List */}
        <div className="col-md-3 col-lg-2 bg-dark text-white p-0 d-flex flex-column" style={{ borderRadius: 12, minWidth: 180 }}>
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary">
            <span className="fw-bold">Groups</span>
            <button className="btn btn-sm btn-success" onClick={() => setShowCreateModal(true)} title="Create Group">+</button>
          </div>
          <ul className="list-group list-group-flush flex-grow-1 overflow-auto" style={{ borderRadius: 0 }}>
            {groups.map(group => (
              <li
                key={group._id}
                className={`list-group-item list-group-item-action d-flex align-items-center ${selectedGroup && selectedGroup._id === group._id ? 'active bg-primary text-white' : ''}`}
                style={{ cursor: 'pointer', border: 'none', borderRadius: 0 }}
                onClick={() => {
                  setSelectedGroup(group);
                  setNotif('');
                }}
              >
                <span className="badge bg-secondary me-2" style={{ minWidth: 32, minHeight: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getInitials(group.name)}</span>
                <span className="flex-grow-1">{group.name}</span>
                {unread[group._id] > 0 && <span className="badge bg-danger ms-2">{unread[group._id]}</span>}
              </li>
            ))}
          </ul>
        </div>
        {/* Main Chat Area */}
        <div className="col-md-9 col-lg-10 d-flex flex-column p-0" style={{ background: '#f7f8fa', borderRadius: 12 }}>
          <div className="p-3 border-bottom bg-white d-flex align-items-center" style={{ minHeight: 60 }}>
            <h4 className="mb-0">{selectedGroup ? selectedGroup.name : 'Select a group'}</h4>
          </div>
          <div className="flex-grow-1 overflow-auto p-3" style={{ minHeight: 0, maxHeight: 500 }}>
            {notif && <div className="alert alert-info">{notif}</div>}
            {selectedGroup ? (
              <div>
                {messages.length === 0 && <div className="text-muted">No messages yet.</div>}
                {messages.map(msg => (
                  <div key={msg._id} className={`d-flex mb-2 ${msg.sender === user._id ? 'flex-row-reverse' : ''}`}> 
                    {/* Avatar */}
                    <div className="me-2 ms-2">
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: msg.sender === user._id ? '#6f6fff' : '#bbb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18 }}>
                        {getInitials(msg.sender === user._id ? user.name : (msg.senderName || 'U'))}
                      </div>
                    </div>
                    {/* Bubble */}
                    <div style={{ maxWidth: '70%' }}>
                      <div className={`p-2 rounded-3 ${msg.sender === user._id ? 'bg-primary text-white' : 'bg-light border'}`} style={{ wordBreak: 'break-word', fontSize: 16 }}>
                        <span>{msg.content}</span>
                      </div>
                      <div className="small text-muted mt-1" style={{ fontSize: 12 }}>
                        <span className="fw-bold">{msg.sender === user._id ? 'You' : (msg.senderName || 'User')}</span> · {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div className="text-muted">Select a group to start chatting.</div>
            )}
          </div>
          {/* Input Bar */}
          {selectedGroup && (
            <div className="p-3 border-top bg-white d-flex align-items-center" style={{ minHeight: 64 }}>
              <input
                type="text"
                className="form-control me-2"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={loading}
                placeholder="Type a message... (emoji support coming soon)"
                style={{ fontSize: 16 }}
              />
              <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()} style={{ minWidth: 80 }}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Group</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateGroup}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Group Name</label>
                    <input type="text" className="form-control" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Select Members</label>
                    <select className="form-select" multiple value={selectedMembers} onChange={e => setSelectedMembers(Array.from(e.target.selectedOptions, o => o.value))} required>
                      {allUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupChatPage; 
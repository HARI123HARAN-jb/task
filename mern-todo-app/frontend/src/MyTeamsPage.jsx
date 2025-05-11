import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from './UserContext';

const SOCKET_URL = 'http://localhost:5000';

function MyTeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamsError, setTeamsError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Team tasks state
  const [teamTasks, setTeamTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      setLoadingTeams(true);
      setTeamsError(null);
      try {
        const res = await axios.get('http://localhost:5000/api/teams/my');
        setTeams(res.data);
        if (res.data.length > 0) setSelectedTeam(res.data[0]);
      } catch (err) {
        setTeamsError('Failed to load your teams.');
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  // Fetch tasks for selected team
  useEffect(() => {
    if (!selectedTeam) return;
    const fetchTasks = async () => {
      setLoadingTasks(true);
      setTasksError(null);
      try {
        const res = await axios.get(`http://localhost:5000/api/tasks/team/${selectedTeam._id}`);
        setTeamTasks(res.data);
      } catch (err) {
        setTasksError('Failed to load team tasks.');
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, [selectedTeam]);

  // Fetch chat history for selected team
  useEffect(() => {
    if (!selectedTeam) return;
    const fetchChat = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/team/${selectedTeam._id}`);
        setChatMessages(res.data.map(msg => ({
          message: msg.content,
          sender: msg.senderName || (msg.sender && msg.sender.name) || 'Unknown',
          senderId: msg.sender?._id || null,
          timestamp: msg.createdAt
        })));
      } catch (err) {
        setChatMessages([]);
      }
    };
    fetchChat();
  }, [selectedTeam]);

  // Real-time chat: connect, join room, listen for messages
  useEffect(() => {
    if (!selectedTeam) return;
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    }
    const socket = socketRef.current;
    socket.emit('joinTeamRoom', selectedTeam._id);
    const handleMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };
    socket.on('teamChatMessage', handleMessage);
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    return () => {
      socket.emit('leaveTeamRoom', selectedTeam._id);
      socket.off('teamChatMessage', handleMessage);
    };
  }, [selectedTeam]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Send chat message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTeam || !user) return;
    if (socketRef.current) {
      socketRef.current.emit('teamChatMessage', {
        teamId: selectedTeam._id,
        message: chatInput,
        sender: user._id,
        senderName: user.name
      });
    }
    setChatInput('');
  };

  // Format timestamp
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString();
  };

  // --- Helper: Build hierarchy from flat tasks array ---
  function buildTaskHierarchy(tasks) {
    const taskMap = {};
    tasks.forEach(task => {
      taskMap[task._id] = { ...task, children: [] };
    });
    const roots = [];
    tasks.forEach(task => {
      if (task.parentTask && task.parentTask._id && taskMap[task.parentTask._id]) {
        taskMap[task.parentTask._id].children.push(taskMap[task._id]);
      } else {
        roots.push(taskMap[task._id]);
      }
    });
    return roots;
  }

  // Handler to toggle completion
  const handleToggleComplete = async (task) => {
    try {
      await axios.patch(`http://localhost:5000/api/tasks/${task._id}`, { completed: !task.completed });
      // Refresh tasks
      if (selectedTeam) {
        const res = await axios.get(`http://localhost:5000/api/tasks/team/${selectedTeam._id}`);
        setTeamTasks(res.data);
      }
    } catch (err) {
      alert('Failed to update task status.');
    }
  };

  // Handler to add subtask
  const handleAddSubtask = (task) => {
    window.location.href = `/tasks/new?parentTaskId=${task._id}&parentTaskText=${encodeURIComponent(task.text)}`;
  };

  // --- Helper: Render a task and its subtasks recursively ---
  function renderTaskWithSubtasks(task, level) {
    // Assignment label
    let assignmentLabel = '';
    if (!task.owner) {
      assignmentLabel = 'Assigned to team';
    } else if (user && task.owner._id === user._id) {
      assignmentLabel = 'Assigned to you';
    } else {
      assignmentLabel = `Assigned to ${task.owner.name}`;
    }
    // Status label and highlighting
    const now = new Date();
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = due && !task.completed && due < now;
    const isDueToday = due && !task.completed && due.toDateString() === now.toDateString();
    const isDueSoon = due && !task.completed && due > now && (due - now) / (1000 * 60 * 60 * 24) <= 3;
    let statusClass = '';
    if (task.completed) statusClass = 'list-group-item-success';
    else if (isOverdue) statusClass = 'list-group-item-danger';
    else if (isDueToday) statusClass = 'list-group-item-warning';
    else if (isDueSoon) statusClass = 'list-group-item-info';
    else statusClass = 'list-group-item-secondary';
    const statusLabel = task.completed ? (
      <span className="badge bg-success ms-2">Completed</span>
    ) : (
      <span className="badge bg-secondary ms-2">Pending</span>
    );
    // Can current user toggle completion?
    const canToggle = (!task.owner && user) || (task.owner && user && task.owner._id === user._id);
    return (
      <li key={task._id} className={`list-group-item d-flex align-items-center ${statusClass}`} style={{ marginLeft: level * 24 }}>
        {/* Checkbox for completion */}
        <input
          type="checkbox"
          className="form-check-input me-2"
          checked={task.completed}
          disabled={!canToggle}
          onChange={() => canToggle && handleToggleComplete(task)}
          style={{ cursor: canToggle ? 'pointer' : 'not-allowed' }}
        />
        <div className="flex-grow-1">
          <span style={{ fontWeight: 'bold', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span> {statusLabel}
          <div className="text-muted small mt-1">
            {assignmentLabel}
            {task.dueDate && (
              <>
                {' '}| Due: {new Date(task.dueDate).toLocaleString()}
              </>
            )}
          </div>
        </div>
        {/* Quick Add Subtask Button */}
        <button className="btn btn-outline-primary btn-sm ms-2" title="Add Subtask" onClick={() => handleAddSubtask(task)}>
          + Subtask
        </button>
        {/* Render subtasks recursively */}
        {task.children && task.children.length > 0 && (
          <ul className="list-group mt-2 w-100">
            {task.children.map(child => renderTaskWithSubtasks(child, level + 1))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">My Teams</h1>
      <div className="row">
        {/* Sidebar: Team List */}
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-header">Teams</div>
            <ul className="list-group list-group-flush">
              {loadingTeams && <li className="list-group-item">Loading...</li>}
              {teamsError && <li className="list-group-item text-danger">{teamsError}</li>}
              {!loadingTeams && !teamsError && teams.length === 0 && (
                <li className="list-group-item">No teams found.</li>
              )}
              {!loadingTeams && !teamsError && teams.map(team => (
                <li
                  key={team._id}
                  className={`list-group-item${selectedTeam && selectedTeam._id === team._id ? ' active' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedTeam(team);
                    setChatMessages([]);
                  }}
                >
                  {team.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Main Panel: Team Dashboard */}
        <div className="col-md-9">
          {selectedTeam ? (
            <div>
              {/* Team Info */}
              <div className="card mb-4">
                <div className="card-body">
                  <h3>{selectedTeam.name}</h3>
                  <p className="mb-1"><strong>Description:</strong> {selectedTeam.description || 'No description'}</p>
                  <p className="mb-1"><strong>Admin:</strong> {selectedTeam.admin ? selectedTeam.admin.name : 'N/A'}</p>
                  <p className="mb-1"><strong>Members:</strong> {selectedTeam.members && selectedTeam.members.length > 0 ? selectedTeam.members.map(m => m.name).join(', ') : 'No members'}</p>
                </div>
              </div>
              {/* Team Tasks */}
              <div className="card mb-4">
                <div className="card-header">Team Tasks</div>
                <div className="card-body">
                  {loadingTasks && <p>Loading tasks...</p>}
                  {tasksError && <div className="alert alert-danger">{tasksError}</div>}
                  {!loadingTasks && !tasksError && teamTasks.length === 0 && <p>No tasks assigned to this team.</p>}
                  {!loadingTasks && !tasksError && teamTasks.length > 0 && (
                    <ul className="list-group">
                      {buildTaskHierarchy(teamTasks).map(task => renderTaskWithSubtasks(task, 0))}
                    </ul>
                  )}
                </div>
              </div>
              {/* Team Chat (real-time) */}
              <div className="card mb-4">
                <div className="card-header">Team Chat</div>
                <div className="card-body" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {chatMessages.length === 0 && <div className="text-muted">No messages yet.</div>}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx}>
                      <strong>{msg.sender}</strong>
                      <span className="text-muted small ms-2">{formatTime(msg.timestamp)}</span>
                      <div>{msg.message}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form className="card-footer d-flex" onSubmit={handleSendChat}>
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit" disabled={!chatInput.trim()}>Send</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-muted">Select a team to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyTeamsPage; 
// frontend/src/components/TodoForm.jsx
// Form for creating new tasks, with role-based assignment and subtask fields.

import React, { useState, useEffect } from 'react'; // Keep useState and add useEffect

// Accept 'onAdd' function, 'loading' prop, and new team management props
function TodoForm({ onAdd, loading, isAdmin, users, parentTask, teams, selectedTeam, setSelectedTeam, preselectedTeamName, onInputChange }) { // Added preselectedTeamName and onInputChange
  // State for input fields
  const [text, setText] = useState('');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState(''); // State for due date (string from input[type="datetime-local"])

  // State for owner selection (only relevant for Admins)
  // Initialize with an empty string or null
  const [selectedOwner, setSelectedOwner] = useState('');
  // State for assigning to whole team (Admin only)
  const [assignToTeam, setAssignToTeam] = useState(false);

  // --- Effect to set a default owner if Admin and users are loaded ---
  useEffect(() => {
      if (isAdmin && users && users.length > 0) {
          // Set the default selected owner to the first user in the list
          // Or you could set it to the current Admin user's ID if they are in the list
          setSelectedOwner(users[0]._id);
          console.log("Admin: Default owner set to:", users[0].name); // Log default owner
      } else if (!isAdmin) {
          // If not Admin, ensure selectedOwner is cleared
          setSelectedOwner('');
      }
  }, [isAdmin, users]); // Re-run effect if isAdmin or users list changes


  // --- handleSubmit function definition ---
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission page reload

    // Basic validation
    if (!text.trim()) {
      alert('Please enter a task description.');
      return;
    }

    // Prepare the new todo object to match backend schema
    const newTodo = {
      text: text.trim(), // Trim whitespace from text
      tag: tag.trim() || '', // Send empty string if no tag, backend defaults to 'General'
      // Convert date string from input to a Date object, or undefined if empty
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };

    // --- Add parentTask ID if creating a subtask ---
    if (parentTask) {
        newTodo.parentTask = parentTask._id;
    }

    // --- Add team if selected ---
    if (isAdmin && selectedTeam) {
      newTodo.team = selectedTeam;
    }

    // --- Add selected owner ID if Admin, not assigning to whole team, and an owner is selected ---
    if (isAdmin && !assignToTeam && selectedOwner) {
        newTodo.owner = selectedOwner;
    }
    // If assignToTeam is true, do not set owner (backend will treat as team task)

    onAdd(newTodo); // Call the onAdd function passed from parent (TaskCreationPage)

    // Clear form fields after submission
    setText('');
    setTag('');
    setDueDate('');
    setAssignToTeam(false);
    // Reset selected owner if Admin (optional)
    if (isAdmin && users && users.length > 0) {
         setSelectedOwner(users[0]._id); // Reset to default or first user
    }
  };
  // --- End of handleSubmit function definition ---

  return (
    // The form element calls handleSubmit when submitted
    <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded shadow-sm bg-light">
      {/* Adjust form title based on parentTask */}
      <h5 className="mb-3">{parentTask ? `Add Subtask for "${parentTask.text}"` : 'Add New Task'}</h5>

      {/* --- Display Parent Task Info if creating a subtask --- */}
      {parentTask && (
          <div className="alert alert-info small mb-3" role="alert">
              Creating subtask for: <strong>{parentTask.text}</strong>
          </div>
      )}
      {/* --- End Parent Task Info --- */}


      <div className="mb-3">
        <label htmlFor="todoText" className="form-label">Task Description</label>
        <input
          type="text"
          className="form-control"
          id="todoText"
          placeholder="e.g., Prepare for next lecture, Work on project milestone, Study Chapter 5"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (typeof onInputChange === 'function') onInputChange();
          }}
          required // Make text required
          disabled={loading} // Disable inputs while loading
        />
      </div>

      <div className="row g-3 mb-3"> {/* Use Bootstrap grid for layout */}
        <div className="col-md-6">
          <label htmlFor="todoTag" className="form-label">Tag/Category (Optional)</label> {/* Updated label */}
          <input
            type="text"
            className="form-control"
            id="todoTag" // Renamed id
            placeholder="e.g., History, Project Alpha, Skill XYZ"
            value={tag} // Renamed state
            onChange={(e) => {
              setTag(e.target.value);
              if (typeof onInputChange === 'function') onInputChange();
            }}
            disabled={loading} // Disable inputs while loading
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="todoDueDate" className="form-label">Due Date & Time (Optional)</label>
          <input
            type="datetime-local" // HTML5 date and time picker
            className="form-control"
            id="todoDueDate"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (typeof onInputChange === 'function') onInputChange();
            }}
            disabled={loading} // Disable inputs while loading
          />
        </div>
      </div>

      {/* --- Team Dropdown (Admin Only) --- */}
      {isAdmin && teams && (setSelectedTeam || preselectedTeamName) && (
        <div className="mb-3">
          <label htmlFor="teamSelect" className="form-label">Select Team</label>
          {preselectedTeamName ? (
            <input
              type="text"
              className="form-control"
              value={preselectedTeamName}
              disabled
            />
          ) : (
            <select
              id="teamSelect"
              className="form-select"
              value={selectedTeam || ''}
              onChange={(e) => {
                setSelectedTeam && setSelectedTeam(e.target.value);
                if (typeof onInputChange === 'function') onInputChange();
              }}
              disabled={loading || !setSelectedTeam}
              required
            >
              <option value="">-- Select a Team --</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </select>
          )}
        </div>
      )}
      {/* --- End Team Dropdown --- */}

      {/* --- Assign to Whole Team Checkbox (Admin Only) --- */}
      {isAdmin && selectedTeam && (
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="assignToTeam"
            checked={assignToTeam}
            onChange={(e) => {
              setAssignToTeam(e.target.checked);
              if (typeof onInputChange === 'function') onInputChange();
            }}
            disabled={loading}
          />
          <label className="form-check-label" htmlFor="assignToTeam">
            Assign to whole team (no specific user)
          </label>
        </div>
      )}
      {/* --- End Assign to Whole Team Checkbox --- */}

      {/* --- Assign To Dropdown (Admin Only) --- */}
      {/* Only show if isAdmin is true, not assigning to team, users list is loaded and not empty, and a team is selected */}
      {isAdmin && users && users.length > 0 && selectedTeam && !assignToTeam && (
          <div className="mb-3">
              <label htmlFor="assignTo" className="form-label">Assign To:</label>
              <select
                  id="assignTo"
                  className="form-select"
                  value={selectedOwner}
                  onChange={(e) => {
                    setSelectedOwner(e.target.value);
                    if (typeof onInputChange === 'function') onInputChange();
                  }}
                  disabled={loading} // Disable dropdown while loading
                  required
              >
                  {/* Map through the users list to create options */}
                  {users.map(userOption => (
                      <option key={userOption._id} value={userOption._id}>
                          {userOption.name} ({userOption.email})
                      </option>
                  ))}
              </select>
          </div>
      )}
      {/* --- End Assign To Dropdown --- */}

      {/* Display message if Admin but no users found */}
      {isAdmin && (!users || users.length === 0) && !loading && (
          <div className="alert alert-warning small mb-3" role="alert">
              No users found to assign tasks.
          </div>
      )}


      <button type="submit" className="btn btn-primary w-100" disabled={loading}> {/* Disable button while loading */}
        {parentTask ? 'Add Subtask' : 'Add Task'} {/* Button text changes based on context */}
      </button>
    </form>
  );
}

export default TodoForm; // Export the TodoForm component

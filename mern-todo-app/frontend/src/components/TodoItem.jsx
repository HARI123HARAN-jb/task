// frontend/src/components/TodoItem.jsx
// Renders a single task item with actions, role-based features, and visual indentation.

import React, { useState } from 'react';
import moment from 'moment'; // Ensure moment is installed: npm install moment
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { useAuth } from '../UserContext'; // Import useAuth to get current user and role
import './TodoItem.css'; // Import custom CSS for classy checkbox and fade-out

// TodoItem component now receives the todo object, handlers, isAdmin status, and nestingLevel
function TodoItem({ todo, onDelete, onUpdate, isAdmin, nestingLevel = 0 }) { // Added nestingLevel prop, default to 0
  const { user } = useAuth(); // Get the current logged-in user from context

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  // State for other editable fields if you add them here
  // const [editTag, setEditTag] = useState(todo.tag || '');
  // const [editDueDate, setEditDueDate] = useState(todo.dueDate ? moment(todo.dueDate).format('YYYY-MM-DDTHH:mm') : ''); // For datetime-local input
  const [fadeOut, setFadeOut] = useState(false);

  const navigate = useNavigate(); // Hook for programmatic navigation

  // --- Handlers for Task Actions ---

  // Handle toggling the completion status
  const handleToggleComplete = () => {
    if (user && (user._id === todo.owner._id || isAdmin)) {
      setFadeOut(true); // Start fade-out animation
      setTimeout(() => {
        onUpdate(todo._id, { completed: !todo.completed });
        setFadeOut(false); // Reset for next time
      }, 350); // Match CSS animation duration
    } else {
      alert('You are not authorized to update this task.');
    }
  };

  // Handle deleting the task
  const handleDeleteClick = () => {
     // Only allow deletion if the current user is the owner OR an Admin
     if (user && (user._id === todo.owner._id || isAdmin)) {
         if (window.confirm('Are you sure you want to delete this task?')) { // Confirmation
            onDelete(todo._id);
         }
     } else {
         alert('You are not authorized to delete this task.'); // Provide feedback for unauthorized attempt
     }
  };

  // Handle entering edit mode
  const handleEditClick = () => {
     // Only allow editing if the current user is the owner OR an Admin
     if (user && (user._id === todo.owner._id || isAdmin)) {
        setIsEditing(true);
        // Set initial state for edit inputs if you make other fields editable
        // setEditText(todo.text);
        // setEditTag(todo.tag || '');
        // setEditDueDate(todo.dueDate ? moment(todo.dueDate).format('YYYY-MM-DDTHH:mm') : '');
     } else {
         alert('You are not authorized to edit this task.'); // Provide feedback for unauthorized attempt
     }
  };

  // Handle cancelling edit mode
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditText(todo.text); // Reset text to original value
    // Reset other edit states if applicable
    // setEditTag(todo.tag || '');
    // setEditDueDate(todo.dueDate ? moment(todo.dueDate).format('YYYY-MM-DDTHH:mm') : '');
  };

  // Handle saving changes after editing
  const handleSaveClick = () => {
    if (!editText.trim()) {
      alert('Task description cannot be empty.');
      return;
    }

    // Prepare the updates object
    const updates = {
        text: editText.trim()
        // Add other fields here if they become editable in this component:
        // tag: editTag.trim() || 'General',
        // dueDate: editDueDate ? new Date(editDueDate) : undefined, // Requires editDueDate state
    };

    // Call the onUpdate handler with the task ID and updates
    onUpdate(todo._id, updates);
    setIsEditing(false);
  };

  // --- Handlers for Team Management Actions ---

  // Handle clicking the "Add Subtask" button (visible to owner)
  const handleAddSubtaskClick = () => {
      // Navigate to the task creation page, passing the current task's ID and text as state
      navigate('/tasks/new', { state: { parentTaskId: todo._id, parentTaskText: todo.text } });
      console.log(`Navigating to create subtask for task ID: ${todo._id}`); // Log navigation
  };

  // Handle clicking the "Change Owner" button (visible to Admins only)
  const handleChangeOwnerClick = () => {
      // Implement logic to change the owner. This might involve:
      // 1. Fetching a list of users (requires a new backend endpoint, e.g., GET /api/auth/users)
      // 2. Displaying a modal or a form to select a new user.
      // 3. Calling the updateTask backend endpoint with the new owner's ID.
      alert('Change Owner functionality needs to be implemented.'); // Placeholder alert
      console.log(`Admin clicked Change Owner for task ID: ${todo._id}`); // Log click
  };

  // --- Formatting and Styling Logic ---

  // Format the due date
  const formattedDueDate = todo.dueDate ? moment(todo.dueDate).format('MMM D, YYYY h:mm A') : 'No due date';

  // Determine highlighting based on due date and completion
  const now = moment();
  const isOverdue = todo.dueDate && !todo.completed && moment(todo.dueDate).isBefore(now, 'day');
  const isDueToday = todo.dueDate && !todo.completed && moment(todo.dueDate).isSame(now, 'day');
  // Due Soon: Due within the next 3 days (inclusive of today), not overdue or due today
  const isDueSoon = todo.dueDate && !todo.completed && moment(todo.dueDate).isSameOrAfter(now, 'day') && moment(todo.dueDate).isBefore(now.clone().add(3, 'days'), 'day') && !isOverdue && !isDueToday;

  let highlightingClass = '';
  if (todo.completed) {
      highlightingClass = 'list-group-item-success'; // Green for completed
  } else if (isOverdue) {
      highlightingClass = 'list-group-item-danger'; // Red for overdue
  } else if (isDueToday) {
       highlightingClass = 'list-group-item-warning'; // Yellow for due today
  } else if (isDueSoon) {
       highlightingClass = 'list-group-item-info'; // Light blue for due soon
  }

  // Calculate left padding based on nesting level
  const paddingLeftClass = `ps-${Math.min(nestingLevel * 3, 5)}`; // Max padding level 5 to avoid excessive indentation

  // --- RENDERING ---
  return (
    <li className={`list-group-item d-flex align-items-center ${highlightingClass} ${paddingLeftClass} todo-fade${fadeOut ? ' fade-out' : ''}`}>
      {/* Custom Checkbox for Completion */}
      <div className="custom-checkbox-wrapper me-3">
        <input
          className="custom-checkbox"
          type="checkbox"
          id={`todo-${todo._id}`}
          checked={todo.completed}
          onChange={handleToggleComplete}
          disabled={user && !(user._id === todo.owner._id || isAdmin)}
        />
        <label htmlFor={`todo-${todo._id}`}></label>
      </div>

      {isEditing ? (
        // --- Display when in Editing Mode ---
        <div className="flex-grow-1 me-2">
          <input
            type="text"
            className="form-control form-control-sm"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveClick();
              }
            }}
          />
          {/* Add inputs for editing Tag and Due Date here if desired */}
          {/* <input type="text" value={editTag} onChange={(e) => setEditTag(e.target.value)} placeholder="Tag" className="form-control form-control-sm mt-1" /> */}
          {/* <input type="datetime-local" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="form-control form-control-sm mt-1" /> */}
        </div>
      ) : (
        // --- Display when NOT in Editing Mode ---
        <div className="flex-grow-1 me-2">
          {/* Clickable span for the todo text */}
          <span
            style={{ textDecoration: todo.completed ? 'line-through' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={handleToggleComplete} // Keep clickable for toggling completion
          >
            {todo.text}
          </span>
          {/* Display Tag, Due Date, and Owner */}
          <div className="text-muted small">
            Tag: {todo.tag || 'None'} | Due: {formattedDueDate}
            {/* Display Owner information */}
            {todo.owner && todo.owner.name && (
                <>
                    {' '} | Assigned To: {todo.owner.name} {/* Display owner's name */}
                    {/* Optionally display email for Admin */}
                    {isAdmin && todo.owner.email && ` (${todo.owner.email})`}
                </>
            )}
            {/* Display Parent Task information if it exists */}
            {todo.parentTask && todo.parentTask.text && (
                 <>
                     {' '} | Parent: {todo.parentTask.text} {/* Display parent task's text */}
                 </>
            )}
          </div>
        </div>
      )}

      {/* --- Action Buttons --- */}
      <div>
        {isEditing ? (
          // --- Buttons when in Editing Mode ---
          <>
            <button className="btn btn-success btn-sm me-2" onClick={handleSaveClick}>Save</button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancelClick}>Cancel</button>
          </>
        ) : (
          // --- Buttons when NOT in Editing Mode ---
          <>
            {/* Add Subtask Button (Visible to owner) */}
            {user && todo.owner && user._id === todo.owner._id && (
                 <button className="btn btn-info btn-sm me-2" onClick={handleAddSubtaskClick}>Add Subtask</button>
            )}

            {/* Change Owner Button (Visible to Admins only) */}
            {isAdmin && (
                 <button className="btn btn-warning btn-sm me-2" onClick={handleChangeOwnerClick}>Change Owner</button>
            )}

            {/* Edit Button (Visible to Owner and Admin) */}
             {user && todo.owner && (user._id === todo.owner._id || isAdmin) && (
                 <button className="btn btn-secondary btn-sm me-2" onClick={handleEditClick}>Edit</button>
             )}

            {/* Delete Button (Visible to Owner and Admin) */}
             {user && todo.owner && (user._id === todo.owner._id || isAdmin) && (
                 <button
                   className="btn btn-danger btn-sm"
                   onClick={handleDeleteClick}
                 >
                   Delete
                 </button>
             )}
          </>
        )}
      </div>
    </li>
  );
}

export default TodoItem;
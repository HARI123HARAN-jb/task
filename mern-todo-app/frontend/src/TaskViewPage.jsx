// frontend/src/TaskViewPage.jsx
// Displays tasks with filtering, hierarchy, and Admin-only user filtering.

import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import TodoList from './components/TodoList'; // Import the TodoList component
import { useTodos } from './TodoContext'; // Import the custom hook for task data
import { useAuth } from './UserContext'; // Import the custom hook for auth, role, and authLoading
import moment from 'moment'; // Import moment for date comparisons
import axios from 'axios'; // Added axios for fetching users

// Base URL for your backend API (adjust if different)
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL


function TaskViewPage() {
  // Consume state and functions from the contexts
  // MODIFIED: Added authLoading to destructuring from useAuth
  const { user, isAdmin, authLoading } = useAuth(); // Get user, isAdmin status, and authLoading
  const { todos, loading: todosLoading, error: todosError, deleteTodo, updateTodo } = useTodos(); // Get task data and actions

  // State for filters (these are local to the view page)
  const [tagFilter, setTagFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [hideCompleted, setHideCompleted] = useState(false);
  // State for assigned user filter (Admin only)
  const [assignedUserFilter, setAssignedUserFilter] = useState('All'); // 'All' or a user ID

  // State for the list of all users (for the assigned user filter dropdown - Admin only)
  const [allUsers, setAllUsers] = useState([]);
  // State for loading and error when fetching all users
  const [fetchUsersLoading, setFetchUsersLoading] = useState(false);
  const [fetchUsersError, setFetchUsersError] = useState(null);


  // --- Effect to fetch all users for filter when component is ready (if Admin) ---
  // MODIFIED: Added checks for !authLoading and user before fetching
  useEffect(() => {
       const fetchAllUsers = async () => {
           setFetchUsersLoading(true);
           setFetchUsersError(null);
           try {
               // Call the backend endpoint to get all users (protected, Admin only)
               // This endpoint was added in a previous step (GET /api/auth/users)
               // Request is automatically sent with Authorization header by Axios interceptor
               const response = await axios.get(`${API_URL}/api/auth/users`); // Adjust endpoint if needed
               setAllUsers(response.data); // Assuming response.data is an array of user objects
               console.log("TaskViewPage: Fetched all users for filter:", response.data.length); // Log count

           } catch (err) {
               console.error("TaskViewPage: Error fetching all users for filter:", err);
               setFetchUsersError("Failed to load users for filtering.");
           } finally {
               setFetchUsersLoading(false);
           }
       };

        // Only attempt to fetch if:
        // 1. Authentication status is NOT loading (!authLoading)
        // 2. A user is logged in (user is not null)
        // 3. The logged-in user IS an Admin (isAdmin)
        // This ensures the Axios interceptor has the token ready.
       if (!authLoading && user && isAdmin) {
            console.log("Auth status ready, user is Admin. Attempting to fetch all users for filter...");
            fetchAllUsers();
       } else if (!authLoading && user && !isAdmin) {
            // Logged in but not admin - clear users list for the filter
            console.log("Auth status ready, user is not Admin. Clearing users for filter.");
            setAllUsers([]);
            setAssignedUserFilter('All'); // Reset filter if no longer Admin
            setFetchUsersLoading(false); // Ensure loading is off
       } else if (!authLoading && !user) {
            // Not logged in - clear users list for the filter
            console.log("Auth status ready, no user logged in. Clearing users for filter.");
            setAllUsers([]);
            setAssignedUserFilter('All');
            setFetchUsersLoading(false); // Ensure loading is off
       }
        // If authLoading is true, the effect does nothing until it becomes false.


       // Dependency array: re-run if user, isAdmin, or authLoading status changes
  }, [user, isAdmin, authLoading]); // DEPEND ON user, isAdmin, AND authLoading


  // --- Helper function to build the hierarchical task structure ---
  // Takes a flat array of tasks and returns a tree structure
  const buildTaskHierarchy = (flatTasks) => {
      // Create a map for quick access to tasks by their _id
      const taskMap = {};
      flatTasks.forEach(task => {
           taskMap[task._id] = { ...task, children: [] }; // Initialize each task with an empty children array
      });

      const rootTasks = []; // Array to hold top-level tasks

      // Iterate through the tasks and build the hierarchy
      flatTasks.forEach(task => {
           // If a task has a parentTask and that parent exists in the map, add it as a child
           // Check if parentTask exists and is a valid object/ID
           if (task.parentTask && (task.parentTask._id || typeof task.parentTask === 'string')) {
                const parentId = task.parentTask._id || task.parentTask; // Get the parent ID

                if (taskMap[parentId]) {
                    taskMap[parentId].children.push(taskMap[task._id]);
                } else {
                     // If a parentTask is specified but the parent is not in the list (e.g., due to filtering),
                     // treat this task as a root task for now.
                     // A more robust solution might handle orphaned tasks explicitly or ensure parents are always included.
                     rootTasks.push(taskMap[task._id]);
                }
           } else {
                // If a task has no parentTask, it's a top-level task
                rootTasks.push(taskMap[task._id]);
           }
      });

      // Note: This basic hierarchy builder assumes no cycles in the parentTask references.
      // The backend validation helps prevent cycles during updates.

      return rootTasks; // Return the array of top-level tasks with nested children
  };


  // --- Filtering Logic ---
  // Use useMemo to optimize filtering - it only recalculates filteredTodos
  // when the original 'todos' array from context or any filter state changes.
  const filteredTodos = useMemo(() => {
    let tempTodos = [...todos]; // Start with a copy of the original todos

    // Filter by Tag
    if (tagFilter !== 'All') {
      tempTodos = tempTodos.filter(todo => todo.tag === tagFilter);
    }

    // Filter by Due Date Status
    if (dateFilter !== 'All') {
      const now = moment();
      tempTodos = tempTodos.filter(todo => {
            // Ensure todo and todo.dueDate are valid before checking date properties
           if (!todo) return false;

           if (dateFilter === 'NoDueDate') {
               return !todo.dueDate;
           }

           // For all other date filters, we need a due date
           if (!todo.dueDate) {
               return false;
           }

           const dueDate = moment(todo.dueDate);

           if (dateFilter === 'Overdue') {
             return dueDate.isBefore(now, 'day');
           }
           if (dateFilter === 'Due Today') {
               return dueDate.isSame(now, 'day');
           }
            if (dateFilter === 'Due This Week') {
               return dueDate.isSameOrAfter(now, 'day') && dueDate.isSameOrBefore(now.clone().endOf('week'), 'day'); // Use endOf('week') for clarity
            }

           return true; // Should not reach here if dateFilter is one of the defined options
      });
    }

    // Filter by Completed Status (applied after other filters)
    if (hideCompleted) {
        tempTodos = tempTodos.filter(todo => !todo.completed); // Exclude completed tasks
    }

    // --- Filter by Assigned User (Admin only) ---
    // Apply this filter only if the user is an Admin and a specific user is selected
    if (isAdmin && assignedUserFilter !== 'All') {
        // Ensure todo.owner exists before accessing _id
        tempTodos = tempTodos.filter(todo => todo.owner && todo.owner._id === assignedUserFilter);
    }
    // --- End ADDED ---


    // --- Build Hierarchy from Filtered Tasks ---
     return buildTaskHierarchy(tempTodos); // Return the built hierarchy from the filtered list
  }, [todos, tagFilter, dateFilter, hideCompleted, assignedUserFilter, isAdmin]); // Add isAdmin and assignedUserFilter to dependencies


  // --- RENDERING ---
  if (authLoading) {
      return <div className="text-center mt-5">Loading authentication status...</div>;
  }
  if (!user) {
      return <div className="alert alert-danger mt-4">Please log in to view tasks.</div>;
  }
  if (todosError && !authLoading) {
      return <div className="alert alert-danger mt-4">{todosError}</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Task List</h1>

      {/* --- Filter Controls --- */}
      <div className="row mb-4">
        {/* Tag Filter */}
        <div className="col-md-3">
          <label htmlFor="tagFilter" className="form-label">Filter by Tag:</label>
          <select
            id="tagFilter"
            className="form-select"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            disabled={todosLoading} // Disable filters while tasks are loading
          >
            <option value="All">All Tags</option>
            {/* You would dynamically generate tag options from your tasks */}
            {/* For now, using static examples */}
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="col-md-3">
          <label htmlFor="dateFilter" className="form-label">Filter by Due Date:</label>
          <select
            id="dateFilter"
            className="form-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
             disabled={todosLoading} // Disable filters while tasks are loading
          >
            <option value="All">All Dates</option>
            <option value="NoDueDate">No Due Date</option>
            <option value="Overdue">Overdue</option>
            <option value="Due Today">Due Today</option>
            <option value="Due This Week">Due This Week</option>
             {/* Could add more date filters like "Due This Month" */}
          </select>
        </div>

        {/* Hide Completed Checkbox */}
        <div className="col-md-3 d-flex align-items-end">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="hideCompleted"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
               disabled={todosLoading} // Disable filters while tasks are loading
            />
            <label className="form-check-label" htmlFor="hideCompleted">
              Hide Completed
            </label>
          </div>
        </div>

        {/* --- Assigned User Filter (Admin Only) --- */}
        {/* MODIFIED: Conditionally render this filter only if the user is Admin */}
        {isAdmin && (
            <div className="col-md-3">
                <label htmlFor="assignedUserFilter" className="form-label">Filter by Assigned User:</label>
                <select
                    id="assignedUserFilter"
                    className="form-select"
                    value={assignedUserFilter}
                    onChange={(e) => setAssignedUserFilter(e.target.value)}
                    disabled={todosLoading || fetchUsersLoading} // Disable while tasks or users are loading
                >
                    <option value="All">All Users</option>
                    {/* Map through the fetched allUsers list to create options */}
                    {allUsers.map(userOption => (
                        <option key={userOption._id} value={userOption._id}>{userOption.name}</option>
                    ))}
                </select>
                {/* Add loading/error states for fetching users for the filter dropdown */}
                {fetchUsersLoading && <small className="form-text text-muted">Loading users...</small>}
                {fetchUsersError && <small className="form-text text-danger">{fetchUsersError}</small>}
            </div>
        )}
        {/* --- End Assigned User Filter --- */}

      </div>
      {/* --- End Filter Controls --- */}


      {/* Render the TodoList component, passing the filteredTodos */}
      <TodoList
        todos={filteredTodos}
        loading={todosLoading} // Pass loading and error from TodoContext
        error={todosError}
        onDelete={deleteTodo}
        onUpdate={updateTodo}
         // You might need to pass isAdmin or other context values down if TodoList uses them
      />
    </div>
  );
}

export default TaskViewPage; // Export the component

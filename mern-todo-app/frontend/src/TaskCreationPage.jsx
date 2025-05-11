// frontend/src/TaskCreationPage.jsx
// Page for creating new tasks, with role-based assignment and subtask creation.

import React, { useState, useEffect } from 'react'; // Keep useState and add useEffect
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import TodoForm from './components/TodoForm'; // Import the TodoForm component
import { useTodos } from './TodoContext'; // Import useTodos context
import { useAuth } from './UserContext'; // Import useAuth context
import axios from 'axios'; // Import axios for fetching users (if Admin)

// Base URL for your backend API (adjust if different from your auth API URL)
// CORRECTED: Changed API_API_URL to API_URL
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL
const TEAMS_API_URL = 'http://localhost:5000/api/teams'; // Add this line


function TaskCreationPage() {
  // Consume addTodo function, error state, and loading state from context
  const { addTodo, error: todosError, loading: todosLoading } = useTodos(); // Renamed for clarity
  // Consume user, isAdmin, and authLoading from Auth context
  const { user, isAdmin, authLoading } = useAuth(); // Get user, isAdmin, and authLoading

  const navigate = useNavigate(); // Hook for programmatic navigation
  const location = useLocation(); // Hook to access navigation state

  // State for parent task information if creating a subtask
  const [parentTask, setParentTask] = useState(null); // Stores { _id, text } of parent

  // State for fetching users (only for Admin)
  const [users, setUsers] = useState([]); // List of all users
  const [usersLoading, setUsersLoading] = useState(false); // Loading state for users
  const [usersError, setUsersError] = useState(null); // Error state for users

  // Local error state for form submission issues not from context
  const [localError, setLocalError] = useState(null);

  // State for fetching teams (only for Admin)
  const [teams, setTeams] = useState([]); // List of all teams
  const [selectedTeam, setSelectedTeam] = useState(null); // Selected team ID

  // Add a function to clear errors
  const clearErrors = () => {
    setLocalError(null);
  };

  // --- Effect to check for parent task in navigation state ---
  useEffect(() => {
      // Check if navigation state exists and contains parent task info
      if (location.state && location.state.parentTaskId && location.state.parentTaskText) {
          setParentTask({
              _id: location.state.parentTaskId,
              text: location.state.parentTaskText
          });
          console.log("Creating subtask under parent:", location.state.parentTaskText); // Log parent info
      } else {
          setParentTask(null); // Ensure parentTask is null if no state is passed
      }
      // No dependencies needed here as location.state is stable for a given route render
  }, [location.state]); // Re-run effect if navigation state changes


  // --- Effect to fetch all users if the current user is an Admin ---
  useEffect(() => {
    if (authLoading || !user || !user.token) return; // Don't run until auth is ready and token is present
    if (user && isAdmin) {
      const fetchUsers = async () => {
        setUsersLoading(true);
        setUsersError(null);
        try {
          const response = await axios.get(`${API_URL}/api/auth/users`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setUsers(response.data);
          console.log("Fetched users for Admin:", response.data.length);
        } catch (err) {
          console.error("Error fetching users:", err);
          setUsersError("Failed to load users for assignment.");
        } finally {
          setUsersLoading(false);
        }
      };
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [user, isAdmin, authLoading]);


  // --- Effect to fetch all teams if Admin ---
  useEffect(() => {
    if (authLoading || !user || !user.token) return; // Don't run until auth is ready and token is present
    if (user && isAdmin) {
      const fetchTeams = async () => {
        try {
          const res = await axios.get(TEAMS_API_URL, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setTeams(res.data);
        } catch {
          setTeams([]);
        }
      };
      fetchTeams();
    } else {
      setTeams([]);
    }
  }, [user, isAdmin, authLoading]);

  // Effect to preselect team if coming from team management page
  useEffect(() => {
    if (isAdmin && location.state && location.state.preselectedTeamId) {
      setSelectedTeam(location.state.preselectedTeamId);
    }
  }, [isAdmin, location.state]);


  // Handle the submission of the TodoForm
  const handleAddTodo = async (newTodoData) => {
      setLocalError(null); // Clear previous local errors
      try {
          // Prepare the task data to send to the backend
          const taskDataToSend = {
              text: newTodoData.text,
              dueDate: newTodoData.dueDate,
              tag: newTodoData.tag,
              // Include parentTask ID if creating a subtask
              parentTask: parentTask ? parentTask._id : undefined, // Use undefined if no parent
              // Include owner ID if Admin is assigning and selected an owner
              // The backend controller handles defaulting to the creator if owner is not provided by Admin
              owner: (isAdmin && newTodoData.owner) ? newTodoData.owner : undefined // Use undefined if not Admin or no owner selected
          };

          await addTodo(taskDataToSend); // Call the addTodo function from context with prepared data
          navigate('/tasks'); // Redirect to the tasks view page after successful creation

      } catch (err) {
           console.error("Error during task creation:", err);
           // Use error message from context if available, otherwise local
           setLocalError(todosError || "Failed to add task. Please check details and try again.");
      }
  };

  // Determine overall loading state
  const overallLoading = todosLoading || usersLoading;

  // Determine overall error state
  const overallError = todosError || localError || usersError;


  // --- RENDERING ---

  // Show loading spinner if auth is loading or user/token not ready
  if (authLoading || !user || !user.token) {
    return <div className="text-center mt-5">Loading authentication status...</div>;
  }

  // Show loading spinner if users/teams are loading (for Admin)
  if (isAdmin && (usersLoading || teams.length === 0)) {
    return <div className="text-center mt-5">Loading required data...</div>;
  }

  // Show error if there is a real error (not just 401 on first load)
  if (overallError) {
    return <div className="alert alert-danger" role="alert">{overallError}</div>;
  }

  // Show the form only when everything is ready
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">{parentTask ? `Create Subtask for "${parentTask.text}"` : 'Create New Task'}</h1>
      <TodoForm
        onAdd={handleAddTodo}
        loading={overallLoading}
        isAdmin={isAdmin}
        users={isAdmin ? users : undefined}
        parentTask={parentTask}
        teams={isAdmin ? teams : undefined}
        selectedTeam={isAdmin ? selectedTeam : undefined}
        setSelectedTeam={isAdmin && !(location.state && location.state.preselectedTeamId) ? setSelectedTeam : undefined}
        preselectedTeamName={isAdmin && location.state && location.state.preselectedTeamName ? location.state.preselectedTeamName : undefined}
        onInputChange={clearErrors}
      />
    </div>
  );
}

export default TaskCreationPage;

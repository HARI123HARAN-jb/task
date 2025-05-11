// frontend/src/TodoContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './UserContext'; // Import the auth hook
import moment from 'moment';

// Create the Context
const TodoContext = createContext(null);

// Set the base URL for your backend API
const API_URL = 'http://localhost:5000/api/tasks'; // *** ENSURE THIS MATCHES YOUR BACKEND PORT AND ROUTE ***

// Create a custom hook to easily consume the context
export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

// Create the Provider Component
export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true); // Keep initial loading true
  const [error, setError] = useState(null);

  // Consume the authenticated user from UserContext
  // This is why UserProvider must wrap TodoProvider in main.jsx
  const { user, logout, authLoading } = useAuth(); // Consume user, logout, and authLoading from AuthContext


  // --- API CALLS ---

  // Fetch todos from the backend WHEN the provider mounts OR when user state changes
  useEffect(() => {
    // Log when the effect is triggered and the current user state
    console.log("TodoContext useEffect triggered. Current user state:", user ? 'Authenticated' : 'Not Authenticated');

    const fetchTodos = async () => {
      if (authLoading || !user || !user.token) {
           console.log("Auth loading or no authenticated user found for fetch todos. Skipping API call.");
           setTodos([]);
           setError(null);
           setLoading(false);
           return;
      }

      // If user IS authenticated, proceed with the fetch
      try {
        setLoading(true); // Set loading true before the API call
        setError(null); // Clear previous errors before a new fetch attempt

        console.log("Authenticated user found. Attempting to fetch todos from API..."); // Log before fetch

        // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
        const response = await axios.get(API_URL, {
          headers: {
            'Authorization': `Bearer ${user.token}` // Get the token directly from the user object
          }
        });
        // --- End IMPORTANT CHANGE ---

        setTodos(response.data); // Set todos with the fetched data
        console.log("Fetch todos successful. Data received:", response.data.length, "items."); // Log success

      } catch (error) {
        console.error('Error fetching tasks:', error); // Log the full error object

        // Check the status code of the error response
        if (error.response && error.response.status === 401) {
             // If 401, it means the token is missing, invalid, or expired on the backend
             setError('Session expired or not authorized. Please log in.');
             // We previously considered calling logout() here, but removed it based on observed behavior
        } else {
             // For other errors (network issues, backend server down, etc.)
             setError('Failed to fetch tasks. Ensure backend is running and connected to DB.');
        }
         console.log("Fetch todos failed."); // Log failure state

      } finally {
        setLoading(false); // Set loading false after fetch (whether successful or failed)
         console.log("Fetch todos loading set to false."); // Log loading status change
      }
    };

    // Call the fetch function when the effect is triggered
    // The 'if (!user || !user.token)' check inside fetchTodos handles the case where user is null
    fetchTodos();


    // Add 'user' to the dependency array.
    // This effect will now re-run whenever the 'user' object from AuthContext changes (e.g., after successful login or logout).
    // Including 'logout' in dependencies is generally good practice if you reference it, but not strictly necessary here if not called within the effect.
  }, [user, authLoading]); // Dependency array


  // Add a new todo
  // This function assumes the user is authenticated (routes are protected on backend)
  const addTodo = async (newTodoData) => {
    // Add check to ensure user is authenticated before attempting API call
    if (!user || !user.token) {
        console.error("Cannot add todo: User not authenticated.");
        setError("Not authorized. Please log in to add tasks.");
        return; // Stop the function if no user
    }
    // The user ID is added on the backend via req.user._id from the middleware
    try {
      // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
      const response = await axios.post(API_URL, newTodoData, {
         headers: {
            'Authorization': `Bearer ${user.token}` // Get the token directly from the user object
         }
      });
      // --- End IMPORTANT CHANGE ---
      // Add the new todo (including its _id and user from backend) to the local state immediately
      // Use spread to add the new item to the existing array immutably
      setTodos([response.data, ...todos]); // Add new todo to the top of the list
      setError(null); // Clear errors on success

    } catch (error) {
      console.error('Error adding task:', error); // Log the error
       // Set error based on backend response or a default
       setError(error.response?.data?.message || 'Failed to add task.');
        // Handle 401 specifically if needed (though adding is less likely to hit 401 than fetching initially)
       if (error.response && error.response.status === 401) {
               // Optionally handle 401 here, e.g., prompt re-login
               setError('Not authorized. Please log in again to add tasks.');
          }
    }
     // Note: Loading state for individual operations like add/delete/update is not tied to the main fetch loading.
  };

  // Delete a todo by ID
  const deleteTodo = async (id) => {
     // Add check to ensure user is authenticated before attempting API call
     if (!user || !user.token) {
        console.error("Cannot delete todo: User not authenticated.");
        setError("Not authorized. Please log in to delete tasks.");
        return; // Stop the function if no user
    }
    try {
      // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
      await axios.delete(`${API_URL}/${id}`, {
         headers: {
            'Authorization': `Bearer ${user.token}` // Get the token directly from the user object
         }
      });
      // --- End IMPORTANT CHANGE ---
      // Remove the todo from the local state immediately by filtering
      setTodos(todos.filter(todo => todo._id !== id));
      setError(null); // Clear errors on success

    } catch (error) {
      console.error('Error deleting task:', error); // Log the error
       // Set error based on backend response or a default
       setError(error.response?.data?.message || 'Failed to delete task.');
        // Handle 401 specifically if needed
       if (error.response && error.response.status === 401) {
               setError('Not authorized. Please log in again to delete tasks.');
          }
    }
  };

  // Update a todo by ID with partial updates
  // Expects updates like { completed: true }, { text: 'new text' }, { tag: 'new tag' }, { dueDate: '...' }
  const updateTodo = async (id, updates) => {
     // Add check to ensure user is authenticated before attempting API call
     if (!user || !user.token) {
        console.error("Cannot update todo: User not authenticated.");
        setError("Not authorized. Please log in to update tasks.");
        return; // Stop the function if no user
    }
    try {
      // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
      const response = await axios.patch(`${API_URL}/${id}`, updates, {
         headers: {
            'Authorization': `Bearer ${user.token}` // Get the token directly from the user object
         }
      });
      // --- End IMPORTANT CHANGE ---
      // Update the todo in the local state with the response data
      // Map through todos and replace the one that matches the ID
      setTodos(todos.map(todo =>
        todo._id === id ? response.data : todo
      ));
      setError(null); // Clear errors on success

    } catch (error) {
      console.error('Error updating task:', error); // Log the error
       // Set error based on backend response or a default
       setError(error.response?.data?.message || 'Failed to update task.');
         // Handle 401 specifically if needed
       if (error.response && error.response.status === 401) {
               setError('Not authorized. Please log in again to update tasks.');
          }
    }
  };


  const contextValue = {
    todos, // All todos for the current user (will be empty if not logged in)
    loading, // Loading state for fetching todos
    error, // Error state for todo operations
    addTodo,
    deleteTodo,
    updateTodo,
  };

  return (
    // Provide the context value to the children
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
};

function getTaskNotifications(todos) {
  const notifications = [];
  const now = moment();
  todos.forEach(todo => {
    if (!todo.completed && todo.dueDate) {
      const due = moment(todo.dueDate);
      if (due.isBefore(now, 'day')) {
        notifications.push({ type: 'danger', message: `Task "${todo.text}" is overdue!` });
      } else if (due.isSame(now, 'day')) {
        notifications.push({ type: 'warning', message: `Task "${todo.text}" is due today.` });
      } else if (due.isAfter(now, 'day') && due.diff(now, 'days') <= 3) {
        notifications.push({ type: 'info', message: `Task "${todo.text}" is due soon (${due.fromNow()}).` });
      }
    }
  });
  return notifications;
}

export { getTaskNotifications };
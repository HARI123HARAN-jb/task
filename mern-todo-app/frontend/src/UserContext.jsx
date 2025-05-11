// frontend/src/UserContext.jsx
// Provides user authentication state and functions, including user role check and Admin user creation.

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is installed: npm install axios

// Create the UserContext
const UserContext = createContext(null);

// Base URL for your backend API endpoints
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL

// Custom hook to easily access the UserContext
export const useAuth = () => {
  const context = useContext(UserContext);
  if (!context) {
    // Throw an error if the hook is used outside of a UserProvider
    throw new Error('useAuth must be used within a UserProvider');
  }
  return context;
};

// UserProvider component to wrap your application and provide the context
export const UserProvider = ({ children }) => {
  // Initialize user state from local storage.
  // We now store the user object AND token together in local storage.
  const storedUserWithToken = localStorage.getItem('user');

  // Initialize user state with the user object if found in local storage
  // The user state will hold the user object including role, and potentially the token
  const [user, setUser] = useState(storedUserWithToken ? JSON.parse(storedUserWithToken) : null);
  // Loading state for authentication operations (renamed for clarity in context value)
  const [loading, setLoading] = useState(false);
  // Error state for authentication operations (renamed for clarity in context value)
  const [error, setError] = useState(null);

  // --- Axios Interceptor/Default Header Setup ---
  // Effect to set or remove the Authorization header whenever the user state changes
  useEffect(() => {
    console.log('UserContext useEffect triggered. user:', user);
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      console.log('Set axios header:', axios.defaults.headers.common['Authorization']);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('Removed axios header');
    }
  }, [user]);


  // --- Authentication Functions ---
  // These functions call the backend authentication endpoints
  // IMPORTANT: Removed 'export' keyword as these functions are defined INSIDE the component

  // Signup function: registers a new user (typically for regular users)
  // Assumes backend POST /api/auth/signup returns { user: { _id, name, email, role }, token }
  const signup = async (name, username, email, password, role) => { // Now accepts role
    setLoading(true); // Set loading true
    setError(null); // Clear previous errors
    try {
      // Call the backend signup endpoint
      const response = await axios.post(`${API_URL}/api/auth/signup`, { name, username, email, password, role }); // Send username and role
      const { user: newUser, token: newToken } = response.data; // Destructure user object and token from response

      // Store user object AND token together in Local Storage
      const userWithToken = { ...newUser, token: newToken };
      localStorage.setItem('user', JSON.stringify(userWithToken));

      // Update the user state with the user object and token
      setUser(userWithToken);

      setLoading(false); // Set loading false
      console.log('Signup successful:', newUser.name, 'Role:', newUser.role); // Log success including role
      return newUser; // Return user info on success

    } catch (error) {
      console.error('Error during signup:', error);
      setLoading(false);
      // Set a user-friendly error message from the backend response or a default
      setError(error.response?.data?.error || error.message || 'Signup failed. Please try again.'); // Use error property from backend
      console.log('Signup failed.'); // Log failure
      // Rethrow error for component-level handling if needed
      throw error;
    }
  };

  // Login function: authenticates an existing user
  // Assumes backend POST /api/auth/login returns { user: { _id, name, email, role }, token }
  const login = async (email, password) => { // Removed 'export'
    setLoading(true);
    setError(null);
    try {
      // Call the backend login endpoint
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password }); // Use email, password
      const { user: loggedInUser, token: authToken } = response.data; // Destructure user object and token

      // Store user object AND token together in Local Storage
      const userWithToken = { ...loggedInUser, token: authToken };
      localStorage.setItem('user', JSON.stringify(userWithToken));

      // Update the user state with the user object and token
      setUser(userWithToken);

      setLoading(false);
      console.log('Login successful:', loggedInUser.name, 'Role:', loggedInUser.role); // Log success including role
      return loggedInUser; // Return user info on success

    } catch (error) {
      console.error('Error during login:', error);
      setLoading(false);
      // Set a user-friendly error message
      setError(error.response?.data?.error || error.message || 'Login failed. Invalid email or password.'); // Use error property from backend
      console.log('Login failed.'); // Log failure
      throw error;
    }
  };

  // Logout function: clears user session and calls backend logout endpoint
  // Assumes backend POST /api/auth/logout is protected and uses the token
  const logout = async () => { // Removed 'export', made async to await backend call
      setLoading(true); // Set loading true before logout attempt
      setError(null); // Clear previous errors
    try {
      // Call the backend logout endpoint (protected route, token is sent via interceptor)
      // The interceptor uses the token from the 'user' state which we will clear next.
      // The backend will invalidate the token.
      await axios.post(`${API_URL}/api/auth/logout`);
      console.log("Backend logout successful."); // Log success

    } catch (e) {
      console.error('Backend logout failed:', e); // Log the error
        // We will still clear frontend state even if backend fails for user experience
        setError('Logout failed on server. Please try again.'); // Set a user-friendly error message
    } finally {
        // Clear user data from local storage and state regardless of backend success/failure
        localStorage.removeItem('user');
        setUser(null); // Clear user state (triggers useEffect to remove Axios header)

        setLoading(false); // Set loading false after attempt
        console.log("User logged out from frontend state."); // Log logout
        // alert("You have been logged out."); // Simple user feedback (optional, consider a more integrated UI notification)
    }
  };

  // --- Function for Admin to create a new user ---
  // Assumes backend POST /api/auth/users returns the created user object (without token)
  // IMPORTANT: Removed 'export' keyword as this function is defined INSIDE the component
  const adminCreateUser = async (userData) => { // Removed 'export', Accepts user data (name, email, password, role)
      setLoading(true); // Set loading true
      setError(null); // Clear previous errors
      try {
           // Call the backend endpoint for Admin user creation (protected, Admin only)
           const response = await axios.post(`${API_URL}/api/auth/users`, userData);
           const newUser = response.data; // Assuming backend returns the created user object

           console.log('Admin created user successfully:', newUser.name, 'Role:', newUser.role); // Log success

           setLoading(false); // Set loading false
           return newUser; // Return the created user object

      } catch (error) {
           console.error('Error during Admin user creation:', error);
           setLoading(false);
           // Set a user-friendly error message
           setError(error.response?.data?.error || error.message || 'Failed to create user. Please try again.'); // Use error property from backend
           console.log('Admin user creation failed.'); // Log failure
           throw error; // Rethrow error for component-level handling if needed
      }
  };


  // --- Helper Functions ---
  // Check if the current user has the Admin role
  const isAdmin = user?.role === 'Admin';

  // Check if the user is authenticated (user object exists)
  const isAuthenticated = !!user;


  // The value provided by the context to consuming components
  const contextValue = {
    user, // The authenticated user object (or null), includes role and token
    authLoading: loading, // Loading state specific to auth operations
    authError: error, // Error state specific to auth operations
    signup, // Signup function (defined inside UserProvider)
    login, // Login function (defined inside UserProvider)
    logout, // Logout function (defined inside UserProvider)
    isAdmin, // Helper to check for Admin role
    isAuthenticated, // Helper to check if user is logged in
    adminCreateUser, // Function for Admin to create a user (defined inside UserProvider)
    // Could add a checkAuthStatus or refreshToken function here later
  };

  return (
    // Provide the context value to the children components
    <UserContext.Provider value={contextValue}>
      {children} {/* Render the child components (your App/Routes) */}
    </UserContext.Provider>
  );
};

// Export the useAuth hook as the default export
export default useAuth;

// Removed the separate export statement like 'export { signup, login, adminCreateUser };'
// because the functions are defined inside the component and accessed via the context hook.
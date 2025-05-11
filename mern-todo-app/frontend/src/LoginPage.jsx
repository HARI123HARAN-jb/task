// frontend/src/LoginPage.jsx
// Login page component using the Auth context.

import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom'; // ✅ Added Navigate
import { useAuth } from './UserContext'; // Import the auth hook

function LoginPage() {
  // State for form inputs - Changed from username to email
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input

  // Consume login function, auth loading, and auth error from the auth context
  const { login, authLoading, authError, isAuthenticated } = useAuth(); // Added isAuthenticated check
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Redirect if already authenticated
  if (isAuthenticated) {
      console.log("User already authenticated, redirecting from login page.");
      return <Navigate to="/tasks" replace />;
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation before calling login
    if (!email || !password) { // Check email and password
        alert('Please enter email and password.');
        return;
    }
    try {
      // Call the login function from the context, passing email and password
      await login(email, password);
      // Redirect to the tasks page on successful login - handled by Navigate above
      // navigate('/tasks'); // This line is no longer strictly needed due to the Navigate component
    } catch (error) {
      // The error message is already set in the authError state by the context function
      console.error("Login form submission error:", error); // Log for debugging
      // The UI will display the error via the authError state
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '400px' }}> {/* Optional: limit form width */}
      <h1 className="text-center mb-4">Login</h1>
       {/* Display authentication error message from the context */}
       {authError && (
           <div className="alert alert-danger" role="alert">
               {authError}
           </div>
       )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          {/* Label for email input */}
          <label htmlFor="emailInput" className="form-label">Email address</label> {/* Changed label */}
          <input
            type="email" // Use type="email" for better mobile keyboards and basic browser validation
            className="form-control"
            id="emailInput" // Changed id
            value={email} // Use email state
            onChange={(e) => setEmail(e.target.value)} // Update email state
            required // Make field required
            disabled={authLoading} // Disable form inputs while auth operation is loading
          />
        </div>
        <div className="mb-3">
          <label htmlFor="passwordInput" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="passwordInput"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required // Make field required
            disabled={authLoading} // Disable form inputs while auth operation is loading
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={authLoading}> {/* Disable button while loading */}
          {authLoading ? 'Logging In...' : 'Login'} {/* Button text changes based on loading state */}
        </button>
      </form>
      <p className="mt-3 text-center">
          Don't have an account? <Link to="/signup">Sign Up here</Link> {/* Link to signup page */}
      </p>
    </div>
  );
}

export default LoginPage; // Export the component

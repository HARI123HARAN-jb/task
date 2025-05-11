// frontend/src/SignupPage.jsx
// Signup page component using the Auth context.

import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom'; // Import Link and Navigate
import { useAuth } from './UserContext'; // Import the auth hook

function SignupPage() {
  // State for form inputs - Added name, changed username to email
  const [name, setName] = useState(''); // State for name input
  const [username, setUsername] = useState(''); // State for username input
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [confirmPassword, setConfirmPassword] = useState(''); // State for password confirmation
  const [role, setRole] = useState('User'); // State for role input

  // Consume signup function, auth loading, auth error, and isAuthenticated from the auth context
  const { signup, authLoading, authError, isAuthenticated } = useAuth(); // Added isAuthenticated check
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Redirect if already authenticated
  if (isAuthenticated) {
      console.log("User already authenticated, redirecting from signup page.");
      return <Navigate to="/tasks" replace />;
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation before calling signup - Check name, username, email, password, confirmPassword, role
    if (!name || !username || !email || !password || !confirmPassword || !role) {
        alert('Please enter all fields.');
        return;
    }
     if (password !== confirmPassword) {
         alert('Passwords do not match.');
         return;
     }
      // Password length check (backend also validates this)
      if (password.length < 7) { // Backend requires min length 7
          alert('Password must be at least 7 characters long.');
          return;
      }


    try {
      // Call the signup function from the context, passing name, username, email, password, and role
      await signup(name, username, email, password, role);
      // Redirect to the tasks page (or login page) after successful signup
      // Redirecting to tasks page implies auto-login after signup (handled by context setUser)
      // This navigation is handled by the Navigate component above if isAuthenticated becomes true
      // navigate('/tasks');
    } catch (error) {
      // The error message is already set in the authError state by the context function
      console.error("Signup form submission error:", error); // Log for debugging
      // The UI will display the error via the authError state
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '400px' }}> {/* Optional: limit form width */}
      <h1 className="text-center mb-4">Sign Up</h1>
       {/* Display authentication error message from the context */}
       {authError && (
           <div className="alert alert-danger" role="alert">
               {authError}
           </div>
       )}
      <form onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="mb-3">
          <label htmlFor="nameInput" className="form-label">Name</label> {/* New label */}
          <input
            type="text"
            className="form-control"
            id="nameInput" // New id
            value={name} // Use name state
            onChange={(e) => setName(e.target.value)} // Update name state
            required // Make field required
            disabled={authLoading} // Disable form inputs while auth operation is loading
          />
        </div>
        {/* Username Input */}
        <div className="mb-3">
          <label htmlFor="usernameInput" className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            id="usernameInput"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={authLoading}
          />
        </div>
        {/* Email Input */}
        <div className="mb-3">
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
        {/* Password Input */}
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
         {/* Confirm Password Input */}
         <div className="mb-3">
          <label htmlFor="confirmPasswordInput" className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            id="confirmPasswordInput"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required // Make field required
            disabled={authLoading} // Disable form inputs while auth operation is loading
          />
        </div>
        {/* Role Input */}
        <div className="mb-3">
          <label htmlFor="roleInput" className="form-label">Role</label>
          <select
            className="form-select"
            id="roleInput"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            disabled={authLoading}
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={authLoading}> {/* Disable button while loading */}
            {authLoading ? 'Signing Up...' : 'Sign Up'} {/* Button text changes based on loading state */}
        </button>
      </form>
       <p className="mt-3 text-center">
          Already have an account? <Link to="/login">Login here</Link> {/* Link to login page */}
       </p>
    </div>
  );
}

export default SignupPage; // Export the component

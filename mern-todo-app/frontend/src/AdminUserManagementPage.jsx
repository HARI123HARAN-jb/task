// frontend/src/AdminUserManagementPage.jsx
// Page for Admin users to view existing users and create/delete new ones.
// MODIFIED: Added Username field to the Create New User form.

import React, { useState, useEffect } from 'react';
import { useAuth } from './UserContext'; // Import useAuth for role check, user creation function, and authLoading
import { Navigate } from 'react-router-dom'; // Import Navigate for redirection
import axios from 'axios'; // Import axios for fetching and deleting users

// Base URL for your backend API (adjust if different)
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL


function AdminUserManagementPage() {
    // Consume user, isAdmin status, adminCreateUser function, and authLoading from Auth context
    const { user, isAdmin, adminCreateUser, authLoading, authError } = useAuth();

    // State for the list of users
    const [users, setUsers] = useState([]);
    // State for loading and error when fetching users
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // State for the new user creation form
    const [newUserFormData, setNewUserFormData] = useState({
        name: '',
        // ADDED: Include username in the form state
        username: '',
        email: '',
        password: '',
        role: 'User' // Default role for new users created by Admin
    });
    // State for loading and error when creating a user
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState(null);

    // State for loading and error when deleting a user
    const [deleteLoading, setDeleteLoading] = useState(false); // State for delete loading
    const [deleteError, setDeleteError] = useState(null); // State for delete error


    // --- Effect to fetch all users when component is ready and user is Admin ---
    // MODIFIED: Added checks for !authLoading and user before fetching
    useEffect(() => {
        const fetchUsers = async () => { // Moved fetch logic into a function to call it manually
            setFetchLoading(true);
            setFetchError(null);
            try {
                // Call the backend endpoint to get all users (protected, Admin only)
                // Assuming a backend endpoint like GET /api/auth/users exists to get all users
                // Request is automatically sent with Authorization header by Axios interceptor
                const response = await axios.get(`${API_URL}/api/auth/users`); // Adjust endpoint if needed
                setUsers(response.data); // Assuming response.data is an array of user objects
                console.log("Admin: Fetched users:", response.data.length); // Log count
            } catch (err) {
                console.error("Error fetching users:", err);
                setFetchError("Failed to load users.");
            } finally {
                setFetchLoading(false);
            }
        };

         // Only attempt to fetch if:
         // 1. Authentication status is NOT loading (!authLoading)
         // 2. A user is logged in (user is not null)
         // 3. The logged-in user IS an Admin (isAdmin)
         // This ensures the Axios interceptor has the token ready.
        if (!authLoading && user && isAdmin) {
            console.log("Auth status ready, user is Admin. Attempting to fetch users...");
            fetchUsers();
        } else if (!authLoading && user && !isAdmin) {
             // Logged in but not admin - fetch shouldn't happen, but log for clarity
             console.log("Auth status ready, user is not Admin. Not fetching users.");
             setUsers([]); // Clear users if user is no longer Admin
             setFetchLoading(false); // Ensure loading is off
        } else if (!authLoading && !user) {
             // Not logged in - fetch shouldn't happen, but log for clarity
             console.log("Auth status ready, no user logged in. Not fetching users.");
             setUsers([]); // Clear users if user logs out
             setFetchLoading(false); // Ensure loading is off
        }
        // If authLoading is true, the effect does nothing until it becomes false.


        // Cleanup function (optional)
        return () => {
            // If you were using AbortController for axios, you would abort here
        };

    }, [user, isAdmin, authLoading]); // DEPEND ON user, isAdmin, AND authLoading


    // --- Handle New User Form Input Changes ---
    const handleNewUserInputChange = (e) => {
        const { name, value } = e.target;
        setNewUserFormData({
            ...newUserFormData,
            [name]: value
        });
    };

    // --- Handle New User Form Submission ---
    const handleCreateUserSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Basic frontend validation
        // MODIFIED: Added username validation
        if (!newUserFormData.name.trim() || !newUserFormData.username.trim() || !newUserFormData.email.trim() || !newUserFormData.password.trim()) {
             setCreateError('Please fill in all required fields.');
             return;
        }
        // Add password length check to match backend (minlength 7)
        if (newUserFormData.password.length < 7) {
             setCreateError('Password must be at least 7 characters long.');
             return;
        }


        setCreateLoading(true);
        setCreateError(null); // Clear previous creation errors

        try {
            // Call the adminCreateUser function from the Auth context
            // The context function handles the API call and sets authError if needed
            // MODIFIED: Pass newUserFormData including username
            await adminCreateUser(newUserFormData);

            // Clear the form after successful creation
            setNewUserFormData({
                name: '',
                username: '', // Reset username field
                email: '',
                password: '',
                role: 'User'
            });

            // Refresh the user list after successful creation
            console.log("New user created, refreshing user list..."); // Log refresh
            // Call fetchUsers only if auth status is ready and user is still Admin
            if (!authLoading && user && isAdmin) {
                 fetchUsers(); // Re-fetch the list of users
            } else {
                 console.warn("Auth status changed or user is no longer Admin. Not refreshing user list after creation.");
                 // You might want to handle this case, e.g., show a message or redirect
            }


        } catch (err) {
            console.error("Error creating new user:", err);
            // The adminCreateUser function in context already sets authError,
            // but we can set a local error for specific form submission issues if needed.
            // For now, we'll rely on authError or set a generic local error.
            // The error message from the backend should be in err.response.data.error
            setCreateError(err.response?.data?.error || err.message || "Failed to create user. Check details."); // Set local error

        } finally {
            setCreateLoading(false);
        }
    };

    // --- Handle Delete User ---
    const handleDeleteUser = async (userIdToDelete) => {
        // Prevent Admin from deleting themselves
        if (user && user._id === userIdToDelete) {
            alert("You cannot delete your own account.");
            return;
        }

        if (window.confirm('Are you sure you want to delete this user? This will also delete all their tasks and schedules.')) {
            setDeleteLoading(true); // Set delete loading true
            setDeleteError(null); // Clear previous delete errors
            try {
                // Call the backend endpoint to delete a user (protected, Admin only)
                // Request is automatically sent with Authorization header by Axios interceptor
                const response = await axios.delete(`${API_URL}/api/auth/users/${userIdToDelete}`); // Adjust endpoint if needed
                console.log("User deleted successfully:", response.data.user.email); // Log success

                // Remove the user from the local state immediately
                setUsers(users.filter(userItem => userItem._id !== userIdToDelete));

            } catch (err) {
                console.error("Error deleting user:", err);
                setDeleteError(err.response?.data?.error || err.message || "Failed to delete user."); // Set delete error
            } finally {
                setDeleteLoading(false); // Set delete loading false
            }
        }
    };
    // --- End ADDED ---


    // Determine overall loading state
    const overallLoading = authLoading || fetchLoading || createLoading || deleteLoading;

    // Determine overall error state
    // Prioritize authError from context as it's more fundamental
    const overallError = authError || fetchError || createError || deleteError;


    // --- Role Check and Redirection ---
    if (authLoading) {
        return <div className="text-center mt-5">Loading authentication status...</div>;
    }
    if (!user || !isAdmin) {
        // Redirect to login if not authenticated, or to tasks if authenticated but not Admin
        console.warn(`User ${user?.name} attempted to access Admin page but is not Admin.`); // Log unauthorized access
        return <Navigate to={user ? "/tasks" : "/login"} replace />;
    }
    // Only show error if not loading
    if (overallError && !authLoading) {
        return <div className="alert alert-danger" role="alert">{overallError}</div>;
    }

    // --- RENDERING ---
    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Admin User Management</h1>

            {/* Display overall error messages */}
            {overallError && (
                    <div className="alert alert-danger" role="alert">
                        {overallError}
                    </div>
            )}

            {/* --- New User Creation Form --- */}
            <div className="card mb-4">
                <div className="card-header">Create New User</div>
                <div className="card-body">
                    {/* Creation specific messages */}
                    {createLoading && <p>Creating user...</p>}

                    <form onSubmit={handleCreateUserSubmit}>
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                name="name"
                                value={newUserFormData.name}
                                onChange={handleNewUserInputChange}
                                required
                                disabled={overallLoading} // Disable form while any operation is loading
                            />
                        </div>
                        {/* ADDED: Username Input Field */}
                         <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                name="username"
                                value={newUserFormData.username}
                                onChange={handleNewUserInputChange}
                                required // Make username required on the frontend
                                disabled={overallLoading}
                            />
                         </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={newUserFormData.email}
                                onChange={handleNewUserInputChange}
                                required
                                disabled={overallLoading}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                value={newUserFormData.password}
                                onChange={handleNewUserInputChange}
                                required
                                disabled={overallLoading}
                            />
                        </div>
                         <div className="mb-3">
                            <label htmlFor="role" className="form-label">Role</label>
                            <select
                                className="form-select"
                                id="role"
                                name="role"
                                value={newUserFormData.role}
                                onChange={handleNewUserInputChange}
                                disabled={overallLoading}
                            >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                            </select>
                         </div>
                        <button type="submit" className="btn btn-primary" disabled={overallLoading}>
                            {createLoading ? 'Creating...' : 'Create User'}
                        </button>
                    </form>
                </div>
            </div>
            {/* --- End New User Creation Form --- */}

            {/* --- Existing Users List --- */}
            <h2>Existing Users</h2>
            {/* Display fetch specific messages */}
            {fetchLoading && <p>Loading users...</p>}
             {/* Display delete specific messages */}
             {deleteLoading && <p>Deleting user...</p>}

            {/* Display the list of users if loaded and not empty */}
            {/* MODIFIED: Check !fetchLoading instead of !overallLoading for displaying the list */}
            {!fetchLoading && !fetchError && users.length > 0 && (
                <table className="table table-striped">
                    <thead>
                         {/* Removed extra whitespace/newlines here */}
                        <tr>
                            <th>Name</th>
                            {/* ADDED: Table header for Username */}
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Actions</th> {/* Column for action buttons */}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(userItem => (
                            <tr key={userItem._id}>
                                <td>{userItem.name}</td>
                                {/* ADDED: Display username in the table row */}
                                <td>{userItem.username || 'N/A'}</td> {/* Display 'N/A' if username is null/undefined */}
                                <td>{userItem.email}</td>
                                <td>{userItem.role}</td>
                                <td>{userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    {/* Delete Button - Disable while any operation is loading or if it's the current user */}
                                    <button
                                         className="btn btn-danger btn-sm"
                                         onClick={() => handleDeleteUser(userItem._id)}
                                         disabled={overallLoading || (user && user._id === userItem._id)} // Disable if deleting or if it's the logged-in admin
                                    >
                                         Delete
                                    </button>
                                    {/* Could add an Edit User button here later */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Display message if no users found */}
            {/* MODIFIED: Check !fetchLoading instead of !overallLoading for displaying the "No users found" message */}
            {!fetchLoading && !fetchError && users.length === 0 && (
                    <p>No users found.</p>
            )}
            {/* --- End Existing Users List --- */}

        </div>
    );
}

export default AdminUserManagementPage; // Export the component

// frontend/src/AdminTeamManagementPage.jsx
// Page for Admin users to view and manage teams, with Create Team and Manage Members modal integration.
// MODIFIED: Added checks for authLoading and user before fetching teams.

import React, { useState, useEffect } from 'react';
import { useAuth } from './UserContext'; // Import useAuth for role check and authLoading
import { Navigate, useNavigate } from 'react-router-dom'; // Import Navigate for redirection and useNavigate for navigation
import axios from 'axios'; // Import axios for fetching teams

import CreateTeamModal from './components/CreateTeamModal'; // Import the CreateTeamModal
import ManageTeamMembersModal from './components/ManageTeamMembersModal'; // Import the ManageTeamMembersModal

// Base URL for your backend API (adjust if different)
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL


function AdminTeamManagementPage() {
    // Consume user, isAdmin status, and authLoading from Auth context
    const { user, isAdmin, authLoading, authError } = useAuth();
    const navigate = useNavigate(); // Add useNavigate hook

    // State for the list of teams
    const [teams, setTeams] = useState([]);
    // State for loading and error when fetching teams
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // State for controlling the "Create New Team" modal/form
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false); // State to control modal visibility

    // State for the team currently being managed (for adding/removing members)
    const [managingTeam, setManagingTeam] = useState(null); // Stores the team object being managed
    const [showManageMembersModal, setShowManageMembersModal] = useState(false); // State to control manage members modal visibility


    // --- Effect to fetch all teams when component is ready and user is Admin ---
    // MODIFIED: Added checks for !authLoading and user before fetching
    useEffect(() => {
        const fetchTeams = async () => { // Moved fetch logic into a function to call it manually
            setFetchLoading(true);
            setFetchError(null);
            try {
                // Call the backend endpoint to get all teams (protected, Admin only)
                // Request is automatically sent with Authorization header by Axios interceptor
                const response = await axios.get(`${API_URL}/api/teams`); // Adjust endpoint if needed
                // Sort teams by name alphabetically
                const sortedTeams = response.data.sort((a, b) => a.name.localeCompare(b.name));
                setTeams(sortedTeams); // Assuming response.data is an array of team objects
                console.log("Admin: Fetched and sorted teams:", sortedTeams.length); // Log count
            } catch (err) {
                console.error("Error fetching teams:", err);
                setFetchError("Failed to load teams.");
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
            console.log("Auth status ready, user is Admin. Attempting to fetch teams...");
            fetchTeams();
        } else if (!authLoading && user && !isAdmin) {
             // Logged in but not admin - fetch shouldn't happen, but log for clarity
             console.log("Auth status ready, user is not Admin. Not fetching teams.");
             setTeams([]); // Clear teams if user is no longer Admin
             setFetchLoading(false); // Ensure loading is off
        } else if (!authLoading && !user) {
             // Not logged in - fetch shouldn't happen, but log for clarity
             console.log("Auth status ready, no user logged in. Not fetching teams.");
             setTeams([]); // Clear teams if user logs out
             setFetchLoading(false); // Ensure loading is off
        }
        // If authLoading is true, the effect does nothing until it becomes false.

        // Cleanup function (optional, useful for aborting requests if component unmounts)
        return () => {
            // If you were using an AbortController for axios, you would abort here
        };

    }, [user, isAdmin, authLoading]); // DEPEND ON user, isAdmin, AND authLoading


    // --- Handlers for actions ---
    // Handler for successful team creation from the modal
    const handleCreateTeamSuccess = (newTeam) => {
        console.log("Team created successfully:", newTeam);
        // Add the new team to the list and re-sort
        setTeams(prevTeams => [...prevTeams, newTeam].sort((a, b) => a.name.localeCompare(b.name)));
        setShowCreateTeamModal(false); // Close the modal
    };

    // Handler for successful team update (e.g., member added/removed)
    const handleUpdateTeamSuccess = (updatedTeam) => {
        console.log("Team updated successfully:", updatedTeam);
        // Update the team in the list with the new data from the backend response
        setTeams(prevTeams => prevTeams.map(team => team._id === updatedTeam._id ? updatedTeam : team).sort((a, b) => a.name.localeCompare(b.name)));

        setManagingTeam(null); // Clear the managing team state
        setShowManageMembersModal(false); // Close the modal
    };

    const handleDeleteTeam = async (teamId) => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                // Call backend delete endpoint
                await axios.delete(`${API_URL}/api/teams/${teamId}`);
                console.log("Team deleted successfully:", teamId);
                // Remove the team from the list
                setTeams(teams.filter(team => team._id !== teamId));
            } catch (err) {
                console.error("Error deleting team:", err);
                setFetchError("Failed to delete team."); // Use fetchError state for simplicity
            }
        }
    };

    // Handler for clicking the "Manage Members" button
    const handleManageMembersClick = (team) => {
        setManagingTeam(team); // Set the team to manage in state
        setShowManageMembersModal(true); // Show the manage members modal
        console.log("Opening Manage Members modal for team:", team.name); // Log action
    };

    // Handler for creating a task for a team
    const handleCreateTaskForTeam = (team) => {
        // Navigate to the task creation page, passing the team ID and name as state
        navigate('/tasks/new', { state: { preselectedTeamId: team._id, preselectedTeamName: team.name } });
    };
    // --- End Handlers ---


    // --- Role Check and Redirection ---
    if (authLoading) {
        return <div className="text-center mt-5">Loading authentication status...</div>;
    }
    if (!user || !isAdmin) {
        // Redirect to login if not authenticated, or to tasks if authenticated but not Admin
        console.warn(`User ${user?.name} attempted to access Admin Team Management page but is not Admin.`); // Log unauthorized access
        return <Navigate to={user ? "/tasks" : "/login"} replace />;
    }
    // Only show error if not loading
    if (fetchError && !authLoading) {
        return <div className="alert alert-danger" role="alert">{fetchError}</div>;
    }

    // --- RENDERING ---
    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Admin Team Management</h1>

            {/* Display overall authentication errors from context */}
            {authError && (
                    <div className="alert alert-danger" role="alert">
                        Authentication Error: {authError}
                    </div>
            )}

            {/* Button to open Create New Team modal */}
            <div className="mb-3">
                    <button className="btn btn-primary" onClick={() => setShowCreateTeamModal(true)} disabled={fetchLoading}>Create New Team</button>
            </div>


            {/* --- Existing Teams List --- */}
            <h2>Existing Teams</h2>
            {/* Display fetch errors */}
            {fetchError && (
                    <div className="alert alert-danger" role="alert">
                        {fetchError}
                    </div>
            )}
            {/* Display fetch loading */}
            {fetchLoading && <p>Loading teams...</p>}

            {/* Display the list of teams if loaded and not empty */}
            {/* MODIFIED: Check !fetchLoading instead of !overallLoading for displaying the list */}
            {!fetchLoading && !fetchError && teams.length > 0 && (
                <table className="table table-striped">
                    <thead>
                         {/* Removed extra whitespace/newlines here */}
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Admin</th>
                            <th>Members</th>
                            <th>Actions</th> {/* Column for action buttons */}
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map(team => (
                            <tr key={team._id}>
                                <td>{team.name}</td>
                                <td>{team.description}</td>
                                {/* Check if admin is populated before accessing name */}
                                <td>{team.admin ? team.admin.name : 'N/A'}</td>
                                <td>
                                    {/* Display member names - Check if members is populated and an array */}
                                    {team.members && Array.isArray(team.members) && team.members.length > 0 ? (
                                            team.members.map(member => member.name).join(', ')
                                    ) : (
                                            'No members'
                                    )}
                                </td>
                                <td>
                                    {/* Action buttons for each team */}
                                    {/* Call handleManageMembersClick with the current team object */}
                                    <button
                                            className="btn btn-secondary btn-sm me-2"
                                            onClick={() => handleManageMembersClick(team)}
                                            disabled={fetchLoading} // Disable while fetching
                                    >
                                            Manage Members
                                    </button>
                                    <button
                                            className="btn btn-danger btn-sm me-2"
                                            onClick={() => handleDeleteTeam(team._id)}
                                            disabled={fetchLoading} // Disable while fetching
                                    >
                                            Delete
                                    </button>
                                    {/* Add Create Task button for Admins */}
                                    <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleCreateTaskForTeam(team)}
                                            disabled={fetchLoading} // Disable while fetching
                                    >
                                            Create Task
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Display message if no teams found */}
            {/* MODIFIED: Check !fetchLoading instead of !overallLoading for displaying the "No teams found" message */}
            {!fetchLoading && !fetchError && teams.length === 0 && (
                    <p>No teams found.</p>
            )}
            {/* --- End Existing Teams List --- */}

            {/* --- Modals --- */}
            {/* Conditionally render the CreateTeamModal */}
            {showCreateTeamModal && (
                    <CreateTeamModal
                        onClose={() => setShowCreateTeamModal(false)} // Pass close handler
                        onCreateSuccess={handleCreateTeamSuccess} // Pass success handler
                    />
            )}
            {/* Conditionally render the ManageTeamMembersModal */}
            {showManageMembersModal && managingTeam && ( // Render only if showManageMembersModal is true AND a team is selected for managing
                    <ManageTeamMembersModal
                        team={managingTeam} // Pass the team object to the modal
                        onClose={() => { setShowManageMembersModal(false); setManagingTeam(null); }} // Close handler, also clears managingTeam state
                        onUpdateSuccess={handleUpdateTeamSuccess} // Pass update success handler
                    />
            )}
            {/* --- End Modals --- */}

        </div>
    );
}

export default AdminTeamManagementPage; // Export the component

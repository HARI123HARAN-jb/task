// frontend/src/components/ManageTeamMembersModal.jsx
// Modal component for Admin users to manage team members (add/remove).

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios for API calls
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation (frontend check)

// Base URL for your backend API (adjust if different)
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL

// ManageTeamMembersModal component receives team object, onClose, and onUpdateSuccess handlers
function ManageTeamMembersModal({ team, onClose, onUpdateSuccess }) {
    // State for the list of all available users (to select members from)
    const [allUsers, setAllUsers] = useState([]);
    // State for loading and error when fetching all users
    const [fetchUsersLoading, setFetchUsersLoading] = useState(false);
    const [fetchUsersError, setFetchUsersError] = useState(null);

    // State for the current team members (can be modified in the modal)
    // Initialize with the members from the passed team prop
    const [currentMembers, setCurrentMembers] = useState(team.members || []);

    // State for the selected user to add
    const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

    // State for loading and error during member update operations (add/remove)
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState(null);


    // --- Effect to fetch all users when the modal opens ---
    useEffect(() => {
        const fetchAllUsers = async () => {
            setFetchUsersLoading(true);
            setFetchUsersError(null);
            try {
                // Call the backend endpoint to get all users (protected, Admin only)
                // This endpoint was added in a previous step (GET /api/auth/users)
                const response = await axios.get(`${API_URL}/api/auth/users`); // Adjust endpoint if needed
                setAllUsers(response.data); // Assuming response.data is an array of user objects
                console.log("ManageTeamMembersModal: Fetched all users:", response.data.length); // Log count

                // Set the default selected user to add to the first user if the list is not empty
                if (response.data.length > 0) {
                    setSelectedUserToAdd(response.data[0]._id);
                }

            } catch (err) {
                console.error("ManageTeamMembersModal: Error fetching all users:", err);
                setFetchUsersError("Failed to load users for member management.");
            } finally {
                setFetchUsersLoading(false);
            }
        };

        // Call the fetch function when the modal mounts
        fetchAllUsers();

        // Dependency array: runs only once on mount
    }, []);


    // --- Handlers for adding/removing members ---

    // Handle adding a selected user to the team
    const handleAddMember = async () => {
        if (!selectedUserToAdd || !mongoose.Types.ObjectId.isValid(selectedUserToAdd)) {
            setUpdateError('Please select a valid user to add.');
            return;
        }

        // Check if the user is already a member (frontend check for better UX)
        if (currentMembers.some(member => member._id === selectedUserToAdd)) {
            setUpdateError('User is already a member of this team.');
            return;
        }

        setUpdateLoading(true); // Set loading true
        setUpdateError(null); // Clear previous errors

        try {
            // Call the backend endpoint to add a member to the team (POST /api/teams/:id/members)
            const response = await axios.post(`${API_URL}/api/teams/${team._id}/members`, { userId: selectedUserToAdd }); // Adjust endpoint if needed
            const updatedTeam = response.data; // Assuming backend returns the updated team object

            console.log("Member added successfully. Updated team:", updatedTeam); // Log success

            // Update the current members state with the new list from the backend response
            setCurrentMembers(updatedTeam.members);

            // Call the success handler passed from the parent with the updated team
            onUpdateSuccess(updatedTeam);

            // Reset the selected user to add (optional, maybe to the first user in the list)
            if (allUsers.length > 0) {
                 setSelectedUserToAdd(allUsers[0]._id);
            } else {
                 setSelectedUserToAdd('');
            }


        } catch (err) {
            console.error("Error adding member:", err);
            setUpdateLoading(false); // Set loading false
            // Set a user-friendly error message
            setUpdateError(err.response?.data?.error || err.message || 'Failed to add member. Please try again.'); // Use error property from backend
        } finally {
             setUpdateLoading(false); // Ensure loading is set to false
        }
    };

    // Handle removing a member from the team
    const handleRemoveMember = async (userIdToRemove) => {
         if (!userIdToRemove || !mongoose.Types.ObjectId.isValid(userIdToRemove)) {
             setUpdateError('Invalid user ID to remove.');
             return;
         }

         // Prevent removing the last member if you have constraints, or the admin of the team
         // For simplicity, we'll allow removing any member for now.

         setUpdateLoading(true); // Set loading true
         setUpdateError(null); // Clear previous errors

         try {
             // Call the backend endpoint to remove a member from the team (DELETE /api/teams/:id/members/:userId)
             // Note: The backend expects the user ID in the request body for the DELETE route in our controller
             const response = await axios.delete(`${API_URL}/api/teams/${team._id}/members/${userIdToRemove}`, { data: { userId: userIdToRemove } }); // Adjust endpoint if needed, pass userId in data for DELETE with body
             const updatedTeam = response.data; // Assuming backend returns the updated team object

             console.log("Member removed successfully. Updated team:", updatedTeam); // Log success

             // Update the current members state with the new list from the backend response
             setCurrentMembers(updatedTeam.members);

             // Call the success handler passed from the parent with the updated team
             onUpdateSuccess(updatedTeam);


         } catch (err) {
             console.error("Error removing member:", err);
             setUpdateLoading(false); // Set loading false
             // Set a user-friendly error message
             setUpdateError(err.response?.data?.error || err.message || 'Failed to remove member. Please try again.'); // Use error property from backend
         } finally {
             setUpdateLoading(false); // Ensure loading is set to false
         }
    };


    // --- Handle closing the modal ---
    const handleClose = () => {
        // Clear states when closing
        setAllUsers([]);
        setFetchUsersLoading(false);
        setFetchUsersError(null);
        setCurrentMembers([]);
        setSelectedUserToAdd('');
        setUpdateLoading(false);
        setUpdateError(null);
        onClose(); // Call the onClose handler passed from the parent
    };


    // --- RENDERING ---
    // Basic modal structure using Bootstrap classes
    return (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-lg" role="document"> {/* Use modal-lg for a larger modal */}
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Manage Members for Team: {team.name}</h5>
                        {/* Close button */}
                        <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} disabled={fetchUsersLoading || updateLoading}></button> {/* Disable close while loading */}
                    </div>
                    <div className="modal-body">
                        {/* Display fetch errors */}
                        {fetchUsersError && (
                             <div className="alert alert-danger" role="alert">
                               {fetchUsersError}
                             </div>
                        )}
                         {/* Display update errors */}
                        {updateError && (
                             <div className="alert alert-danger" role="alert">
                               {updateError}
                             </div>
                        )}
                        {/* Display loading indicator */}
                        {(fetchUsersLoading || updateLoading) && <p className="text-center">Loading...</p>}

                        {/* --- Current Members List --- */}
                        {!fetchUsersLoading && !fetchUsersError && (
                            <div className="mb-4">
                                <h6>Current Members ({currentMembers.length})</h6>
                                {currentMembers.length > 0 ? (
                                    <ul className="list-group">
                                        {currentMembers.map(member => (
                                            <li key={member._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                {member.name} ({member.email})
                                                {/* Remove button - Disable while updating */}
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleRemoveMember(member._id)}
                                                    disabled={updateLoading}
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No members in this team yet.</p>
                                )}
                            </div>
                        )}
                        {/* --- End Current Members List --- */}

                        {/* --- Add Member Section --- */}
                        {!fetchUsersLoading && !fetchUsersError && allUsers.length > 0 && (
                            <div className="mb-3">
                                <h6>Add Member</h6>
                                <div className="d-flex">
                                    {/* Dropdown to select user to add */}
                                    <select
                                        className="form-select me-2"
                                        value={selectedUserToAdd}
                                        onChange={(e) => setSelectedUserToAdd(e.target.value)}
                                        disabled={updateLoading} // Disable while updating
                                    >
                                        {/* Filter out users who are already members from the options */}
                                        {allUsers
                                            .filter(userOption => !currentMembers.some(member => member._id === userOption._id))
                                            .map(userOption => (
                                                <option key={userOption._id} value={userOption._id}>
                                                    {userOption.name} ({userOption.email})
                                                </option>
                                        ))}
                                    </select>
                                    {/* Add button - Disable while updating or if no users available to add */}
                                    <button
                                        className="btn btn-success"
                                        onClick={handleAddMember}
                                        disabled={updateLoading || allUsers.filter(userOption => !currentMembers.some(member => member._id === userOption._id)).length === 0}
                                    >
                                        Add
                                    </button>
                                </div>
                                {/* Message if Admin but no users available to add */}
                                {!updateLoading && allUsers.length > 0 && allUsers.filter(userOption => !currentMembers.some(member => member._id === userOption._id)).length === 0 && (
                                     <div className="alert alert-info small mt-2" role="alert">
                                         All available users are already members of this team.
                                     </div>
                                )}
                            </div>
                        )}
                         {/* Message if Admin but no users found at all */}
                        {!fetchUsersLoading && !fetchUsersError && allUsers.length === 0 && (
                             <div className="alert alert-warning small mt-2" role="alert">
                                 No users found in the system to add to teams.
                             </div>
                        )}
                        {/* --- End Add Member Section --- */}

                    </div>
                    {/* Optional: Modal footer with close button */}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={fetchUsersLoading || updateLoading}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageTeamMembersModal; // Export the component

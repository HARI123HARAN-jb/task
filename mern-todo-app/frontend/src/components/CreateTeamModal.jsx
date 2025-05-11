// frontend/src/components/CreateTeamModal.jsx
// Modal component for Admin users to create a new team.

import React, { useState } from 'react';
import axios from 'axios'; // Import axios for the API call

// Base URL for your backend API (adjust if different)
const API_URL = 'http://localhost:5000'; // Make sure this matches your backend URL

// CreateTeamModal component receives onClose and onCreateSuccess handlers
function CreateTeamModal({ onClose, onCreateSuccess }) {
    // State for form inputs
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    // State for loading and error during team creation
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Handle form submission ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Basic validation
        if (!name.trim()) {
            setError('Team name is required.');
            return;
        }

        setLoading(true); // Set loading true
        setError(null); // Clear previous errors

        try {
            // Prepare the new team data
            const newTeamData = {
                name: name.trim(),
                description: description.trim()
                // Members and Admin are handled by the backend controller
            };

            // Call the backend endpoint to create a team (protected, Admin only)
            const response = await axios.post(`${API_URL}/api/teams`, newTeamData); // Adjust endpoint if needed
            const createdTeam = response.data; // Assuming backend returns the created team object

            console.log("Team created successfully:", createdTeam); // Log success

            // Call the success handler passed from the parent
            onCreateSuccess(createdTeam);

            // Clear form and close modal (handled by parent after success)
            // setName('');
            // setDescription('');
            // onClose();

        } catch (err) {
            console.error("Error creating team:", err);
            setLoading(false); // Set loading false
            // Set a user-friendly error message
            setError(err.response?.data?.error || err.message || 'Failed to create team. Please try again.'); // Use error property from backend
        }
    };

    // --- Handle closing the modal ---
    const handleClose = () => {
        // Clear form state when closing
        setName('');
        setDescription('');
        setError(null); // Clear any errors
        onClose(); // Call the onClose handler passed from the parent
    };


    // --- RENDERING ---
    // Basic modal structure using Bootstrap classes
    return (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Create New Team</h5>
                        {/* Close button */}
                        <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} disabled={loading}></button> {/* Disable close while loading */}
                    </div>
                    <div className="modal-body">
                        {/* Display creation error messages */}
                        {error && (
                             <div className="alert alert-danger" role="alert">
                               {error}
                             </div>
                        )}
                        {/* Display loading indicator */}
                        {loading && <p className="text-center">Creating team...</p>}

                        {/* Team Creation Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="teamName" className="form-label">Team Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="teamName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={loading} // Disable input while loading
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="teamDescription" className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-control"
                                    id="teamDescription"
                                    rows="3"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={loading} // Disable input while loading
                                ></textarea>
                            </div>
                            {/* Submit button */}
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Team'}
                            </button>
                        </form>
                    </div>
                    {/* Optional: Modal footer with close button */}
                    {/* <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>Close</button>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

export default CreateTeamModal; // Export the component

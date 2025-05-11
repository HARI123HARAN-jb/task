// frontend/src/SchedulePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScheduleForm from './components/ScheduleForm';
import ScheduleDisplay from './components/ScheduleDisplay';
import { useAuth } from './UserContext'; // Import useAuth

const SCHEDULE_API_URL = 'http://localhost:5000/api/schedules';


function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSchedule, setCurrentSchedule] = useState(null); // To hold the currently viewed/edited schedule

  const { user, logout, authLoading } = useAuth(); // Consume user, logout, and authLoading from AuthContext


  // Fetch schedules when the page mounts OR when user state changes
  useEffect(() => {
    console.log("SchedulePage useEffect triggered. Current user state:", user ? 'Authenticated' : 'Not Authenticated');

    const fetchSchedules = async () => {
      if (authLoading || !user || !user.token) {
        console.log("Auth loading or no authenticated user found for fetch schedules. Skipping API call.");
        setSchedules([]);
        setError(null);
        setCurrentSchedule(null);
        setLoading(false);
        return;
      }

      // If user IS authenticated, proceed with the fetch
      try {
        setLoading(true); // Set loading true before API call
        setError(null); // Clear previous errors before new fetch attempt

        console.log("Authenticated user found. Attempting to fetch schedules from API..."); // Log before fetch

        // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
        const response = await axios.get(SCHEDULE_API_URL, {
            headers: {
                'Authorization': `Bearer ${user.token}` // Get token directly from user object
            }
        });
        // --- End IMPORTANT CHANGE ---

        setSchedules(response.data); // Set schedules with fetched data

        // Update currentSchedule state based on fetched data
        if (response.data.length > 0) {
             setCurrentSchedule(response.data[0]); // For simplicity, set the first schedule as current
        } else {
             // If no schedules found, clear currentSchedule
             setCurrentSchedule(null);
        }
        console.log("Fetch schedules successful. Data received:", response.data.length, "items."); // Log success


      } catch (error) {
        console.error('Error fetching schedules:', error); // Log the full error

        // Check the status code of the error response
        if (error.response && error.response.status === 401) {
             // If 401, it means the token is missing, invalid, or expired on the backend
             setError('Session expired or not authorized. Please log in.');
        } else {
             // For other errors (network issues, backend server down, etc.)
             setError('Failed to fetch schedules. Ensure backend is running and connected to DB.');
        }
         console.log("Fetch schedules failed."); // Log failure state


      } finally {
        setLoading(false); // Set loading false after fetch (success or failed)
         console.log("Fetch schedules loading set to false."); // Log loading status change
      }
    };

    // Call the fetch function when the effect is triggered
    // The 'if (!user || !user.token)' check inside fetchSchedules handles the case where user is null
    fetchSchedules();

    // Add 'user' to the dependency array.
    // This effect will now re-run whenever the 'user' object from AuthContext changes (e.g., after successful login or logout).
  }, [user, authLoading]); // Dependency array


   // --- Functions to interact with the Schedule Backend ---

   // Function to create the *initial* schedule entry
   const createInitialSchedule = async (scheduleData) => {
       if (!user || !user.token) { // Add check for user
            console.error("Cannot create schedule: User not authenticated.");
            setError("Not authorized. Please log in to create a schedule.");
            return;
       }
       if (schedules.length > 0) {
           console.warn("Schedule already exists, not creating a new one.");
           setError("A schedule already exists. You can add blocks to it below.");
           return;
       }
       try {
           setLoading(true);
           // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
           const response = await axios.post(SCHEDULE_API_URL, scheduleData, {
                headers: {
                    'Authorization': `Bearer ${user.token}` // Get token directly from user object
                }
           });
           // --- End IMPORTANT CHANGE ---
           setSchedules([response.data]);
           setCurrentSchedule(response.data);
           setError(null);
           console.log("Initial schedule created:", response.data);
           alert("Initial schedule created successfully!");
       } catch (error) {
           console.error("Error creating initial schedule:", error);
            // Make sure 401 is handled appropriately here too if it can occur
           setError(`Failed to create initial schedule: ${error.response?.data?.message || error.message}`);
       } finally {
           setLoading(false);
       }
   };


  // Function to add a new block to the current schedule
  const addBlockToCurrentSchedule = async (blockData) => {
      if (!user || !user.token) { // Add check for user
            console.error("Cannot add block: User not authenticated.");
            setError("Not authorized. Please log in to add blocks.");
            return;
       }
      if (!currentSchedule) {
          console.error("No current schedule selected to add block to.");
          setError("Cannot add block: No schedule found. Please create one first.");
          return;
      }

      if (!blockData || !blockData.day || !blockData.startTime || !blockData.endTime || !blockData.activity) {
          // This should ideally be handled with required attributes or validation in the form component
          console.error("Attempted to add invalid block data:", blockData);
          return;
      }

      try {
           setLoading(true);

           // Send the updated blocks array (with the new block added) to the backend's update route (PATCH)
           // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
           const updatedScheduleResponse = await axios.patch(
               `${SCHEDULE_API_URL}/${currentSchedule._id}`,
               { blocks: [...currentSchedule.blocks, blockData] },
               {
                   headers: {
                       'Authorization': `Bearer ${user.token}` // Get token directly from user object
                   }
               }
           );
           // --- End IMPORTANT CHANGE ---

           // Update local state with the response from the backend (which contains the new block with its _id)
           setCurrentSchedule(updatedScheduleResponse.data);
           // Also update the schedules list if you have multiple schedules in state (optional, but good practice)
           setSchedules(schedules.map(s => s._id === updatedScheduleResponse.data._id ? updatedScheduleResponse.data : s));

           setError(null);
           console.log("Block added successfully:", blockData);
           alert("Schedule block added successfully!");


      } catch (error) {
          console.error("Error adding schedule block:", error);
           // Make sure 401 is handled appropriately here too if it can occur
          setError(`Failed to add schedule block: ${error.response?.data?.message || error.message}`);
      } finally {
           setLoading(false);
      }
  };


   // Function to update an existing block
   const updateBlockInCurrentSchedule = async (blockId, updatedBlockData) => {
        if (!user || !user.token) { // Add check for user
            console.error("Cannot update block: User not authenticated.");
            setError("Not authorized. Please log in to update blocks.");
            return;
       }
       if (!currentSchedule) {
           console.error("No current schedule selected to update block in.");
           setError("Cannot update block: No schedule found.");
           return;
       }

       // Find the index of the block to update
       const blockIndex = currentSchedule.blocks.findIndex(block => block._id === blockId);

       if (blockIndex === -1) {
           console.error(`Block with id ${blockId} not found in current schedule state.`);
           setError("Failed to update block: Block not found.");
           return;
       }

       // Create a new array with the updated block data merged in
       const updatedBlocks = [...currentSchedule.blocks];
       updatedBlocks[blockIndex] = { ...updatedBlocks[blockIndex], ...updatedBlockData }; // Merge existing data with new data


       try {
           setLoading(true); // Indicate loading while updating

           // Send the entire updated blocks array to the backend's update route (PATCH)
           // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
           const updatedScheduleResponse = await axios.patch(
               `${SCHEDULE_API_URL}/${currentSchedule._id}`,
               { blocks: updatedBlocks },
                {
                   headers: {
                       'Authorization': `Bearer ${user.token}` // Get token directly from user object
                   }
               }
           );
            // --- End IMPORTANT CHANGE ---

           // Update local state with the response from the backend
           setCurrentSchedule(updatedScheduleResponse.data);
           setSchedules(schedules.map(s => s._id === updatedScheduleResponse.data._id ? updatedScheduleResponse.data : s));

           setError(null);
           console.log("Block updated successfully:", updatedBlockData);
           alert("Schedule block updated successfully!");


       } catch (error) {
           console.error("Error updating schedule block:", error);
            // Make sure 401 is handled appropriately here too if it can occur
            setError(`Failed to update schedule block: ${error.response?.data?.message || error.message}`);
       } finally {
           setLoading(false);
       }
   };


   // Function to delete a block
   const deleteBlockFromCurrentSchedule = async (blockId) => {
        if (!user || !user.token) { // Add check for user
            console.error("Cannot delete block: User not authenticated.");
            setError("Not authorized. Please log in to delete blocks.");
            return;
       }
       if (!currentSchedule) {
           console.error("No current schedule selected to delete block from.");
           setError("Cannot delete block: No schedule found.");
           return;
       }

        // Confirm deletion with the user
        // This is a standard browser confirmation dialog
        if (!window.confirm("Are you sure you want to delete this schedule block?")) {
            return; // Stop if user cancels
        }


       // Filter out the block to delete by its _id
       const updatedBlocks = currentSchedule.blocks.filter(block => block._id !== blockId);

       try {
           setLoading(true); // Indicate loading while deleting

           // Send the entire updated blocks array (with the block removed) to the backend (PATCH)
           // --- IMPORTANT CHANGE: Explicitly pass the Authorization header ---
           const updatedScheduleResponse = await axios.patch(
               `${SCHEDULE_API_URL}/${currentSchedule._id}`,
               { blocks: updatedBlocks },
               {
                   headers: {
                       'Authorization': `Bearer ${user.token}` // Get token directly from user object
                   }
               }
           );
           // --- End IMPORTANT CHANGE ---

           // Update local state with the response from the backend
           setCurrentSchedule(updatedScheduleResponse.data);
           setSchedules(schedules.map(s => s._id === updatedScheduleResponse.data._id ? updatedScheduleResponse.data : s));

           setError(null);
           console.log(`Block with ID ${blockId} deleted.`);
           alert("Schedule block deleted successfully!");
       } catch (error) {
           console.error("Error deleting schedule block:", error);
            // Make sure 401 is handled appropriately here too if it can occur
            setError(`Failed to delete schedule block: ${error.response?.data?.message || error.message}`);
       } finally {
           setLoading(false);
       }
   };


  // --- RENDERING ---

  if (authLoading) {
    return <div className="text-center mt-5">Loading authentication status...</div>;
  }

  return (
    <div className="container mt-4">
      {/* ... (rendering logic using schedules, currentSchedule, loading, error) ... */}
       <h1 className="text-center mb-4">Weekly Schedule</h1>

      {loading && <p className="text-center">Loading schedule...</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {/* Schedule Input Form */}
       <div className="p-4 border rounded shadow-sm bg-light mb-4">
           <h4>{currentSchedule ? `Add Block to "${currentSchedule.name}"` : 'Create Your First Schedule'}</h4>
           <p>{currentSchedule ? 'Add details for a time block below.' : 'Provide a name for your schedule and optionally add initial blocks.'}</p>
           <ScheduleForm
               onAddBlock={addBlockToCurrentSchedule}
               onCreateSchedule={createInitialSchedule}
               scheduleExists={!!currentSchedule}
               loading={loading}
           />
       </div>

      {/* Schedule Display */}
      {/* Display if NOT loading, NO error, AND a currentSchedule exists */}
      {!loading && !error && currentSchedule ? (
          <div>
               <h3>{currentSchedule.name || 'Unnamed Schedule'}</h3>
               {currentSchedule.description && <p className="text-muted">{currentSchedule.description}</p>}
               {/* Pass blocks and handlers IF blocks exist */}
               {currentSchedule.blocks && currentSchedule.blocks.length > 0 ? (
                    <ScheduleDisplay
                        blocks={currentSchedule.blocks}
                        onUpdateBlock={updateBlockInCurrentSchedule}
                        onDeleteBlock={deleteBlockFromCurrentSchedule}
                    />
               ) : (
                   // Message when schedule exists but has no blocks
                    <p className="text-center">No blocks added to this schedule yet.</p>
               )}
          </div>
      ) : (
           // Display if NOT loading, NO error, NO currentSchedule, and NO schedules at all
           !loading && !error && !currentSchedule && schedules.length === 0 && (
                <p className="text-center">Use the form above to create your first schedule.</p>
           )
           // Note: If error is set, the error message div is shown instead of this.
           // If loading is true, the loading message is shown instead of this.
      )}

    </div>
  );
}

export default SchedulePage;
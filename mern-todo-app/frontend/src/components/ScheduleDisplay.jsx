// frontend/src/components/ScheduleDisplay.jsx
import React, { useState, useMemo } from 'react'; // Import useState
import moment from 'moment'; // For sorting and potentially displaying time

// This component displays a list of schedule blocks, grouped by day, with edit/delete options.
// It receives blocks, onUpdateBlock, and onDeleteBlock functions as props from SchedulePage.jsx.
function ScheduleDisplay({ blocks, onUpdateBlock, onDeleteBlock }) { // Accept handlers as props
    // State to track which block is currently being edited (_id of the block)
    const [editingBlockId, setEditingBlockId] = useState(null);
    // State to hold the data for the block being edited in the form inputs
    const [editBlockData, setEditBlockData] = useState({});


    // Sort blocks by day and then by start time
    const sortedBlocks = useMemo(() => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return [...blocks].sort((a, b) => {
            const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
            if (dayComparison !== 0) {
                return dayComparison;
            }
            // Compare times - assumes HH:mm format
            return moment(a.startTime, 'HH:mm').valueOf() - moment(b.startTime, 'HH:mm').valueOf();
        });
    }, [blocks]);


    // Group blocks by day for easier rendering
    const blocksGroupedByDay = useMemo(() => {
        return sortedBlocks.reduce((acc, block) => {
            const day = block.day;
            if (!acc[day]) {
                acc[day] = [];
            }
            acc[day].push(block);
            return acc;
        }, {});
    }, [sortedBlocks]);

    // Get the days that actually have blocks, sorted
    const daysWithBlocks = useMemo(() => {
        const days = Object.keys(blocksGroupedByDay);
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
        return days;
    }, [blocksGroupedByDay]);


    // --- Handlers for Block Actions ---

    // Handler for clicking Edit button
    const handleEditClick = (block) => {
        setEditingBlockId(block._id); // Set the ID of the block being edited
        // Initialize the edit form state with the current block's data
        setEditBlockData({
             day: block.day,
             startTime: block.startTime,
             endTime: block.endTime,
             activity: block.activity,
             location: block.location || '', // Use empty string for optional fields
             tag: block.tag || '' // Use empty string for optional fields
        });
    };

    // Handler for input changes in the edit form
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditBlockData({...editBlockData, [name]: value});
    };

    // Handler for clicking Save button
    const handleSaveClick = (blockId) => {
        // Basic validation for edited block
        if (!editBlockData.day || !editBlockData.startTime || !editBlockData.endTime || !editBlockData.activity) {
             alert("Please fill in required details for the block (Day, Start/End Time, Activity).");
             return;
        }

        // Call the update handler from SchedulePage, passing the block ID and updated data
        // SchedulePage will handle sending the full array to the backend
        onUpdateBlock(blockId, {
             day: editBlockData.day,
             startTime: editBlockData.startTime,
             endTime: editBlockData.endTime,
             activity: editBlockData.activity,
             location: editBlockData.location.trim() || undefined, // Send undefined if empty
             tag: editBlockData.tag.trim() || undefined,           // Send undefined if empty
        });

        setEditingBlockId(null); // Exit editing mode after saving
        setEditBlockData({}); // Clear edit form state
    };

    // Handler for clicking Cancel button
    const handleCancelClick = () => {
        setEditingBlockId(null); // Exit editing mode
        setEditBlockData({}); // Clear edit form state
    };

    // Handler for clicking Delete button
    const handleDeleteClick = (blockId) => {
         // Confirm deletion with the user using a standard browser confirmation dialog
         if (window.confirm("Are you sure you want to delete this schedule block?")) {
             // Call the delete handler from SchedulePage
             onDeleteBlock(blockId);
         }
         // Note: No need to explicitly exit editing mode here, as the block will be gone from the state if delete is successful
    };


  return (
    <div>
      <h4>Schedule Blocks</h4>
      {blocks.length === 0 ? (
        <p>No schedule blocks added yet.</p>
      ) : (
        <div className="list-group"> {/* Use list-group for overall structure */}
            {daysWithBlocks.map(day => (
                <div key={day} className="mb-3 p-3 border rounded bg-white"> {/* Group blocks by day with card-like style */}
                    <h5>{day}</h5>
                     <ul className="list-group list-group-flush"> {/* Nested list-group without borders */}
                        {/* Map through blocks within this day */}
                        {blocksGroupedByDay[day].map((block) => (
                            // Each list item is a single block
                            // Use block._id as the key - Mongoose automatically adds _id to subdocuments when saved
                            <li key={block._id} className="list-group-item d-flex align-items-center"> {/* Align items */}

                                {editingBlockId === block._id ? (
                                    // --- Display when in EDITING Mode ---
                                    <div className="flex-grow-1 me-2">
                                        <div className="row g-2"> {/* Grid for edit inputs */}
                                            {/* Day Select */}
                                            <div className="col-md-6">
                                                 <select name="day" className="form-select form-select-sm" value={editBlockData.day || ''} onChange={handleEditInputChange} required>
                                                     <option value="">Select Day</option>
                                                     {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                                 </select>
                                            </div>
                                            {/* Start Time Input */}
                                            <div className="col-md-3">
                                                <input type="time" name="startTime" className="form-control form-control-sm" value={editBlockData.startTime || ''} onChange={handleEditInputChange} required />
                                            </div>
                                             {/* End Time Input */}
                                             <div className="col-md-3">
                                                <input type="time" name="endTime" className="form-control form-select-sm" value={editBlockData.endTime || ''} onChange={handleEditInputChange} required />
                                            </div>
                                            {/* Activity Input */}
                                            <div className="col-md-6">
                                                <input type="text" name="activity" className="form-control form-control-sm" value={editBlockData.activity || ''} onChange={handleEditInputChange} placeholder="Activity" required />
                                            </div>
                                            {/* Location Input */}
                                            <div className="col-md-3">
                                                <input type="text" name="location" className="form-control form-select-sm" value={editBlockData.location || ''} onChange={handleEditInputChange} placeholder="Location" />
                                            </div>
                                             {/* Tag Input */}
                                             <div className="col-md-3">
                                                <input type="text" name="tag" className="form-control form-select-sm" value={editBlockData.tag || ''} onChange={handleEditInputChange} placeholder="Tag" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // --- Display when NOT in EDITING Mode ---
                                    <div className="flex-grow-1 me-2">
                                        {/* Display block details */}
                                        <strong>{block.startTime} - {block.endTime}</strong>: {block.activity}
                                        <div className="text-muted small">
                                            {block.location && `Location: ${block.location}`}
                                            {block.location && block.tag && ' | '} {/* Add separator if both exist */}
                                            {block.tag && `Tag: ${block.tag}`} {/* Display tag if it exists */}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div>
                                    {editingBlockId === block._id ? (
                                        // --- Buttons in EDITING Mode ---
                                        <>
                                            <button className="btn btn-success btn-sm me-2" onClick={() => handleSaveClick(block._id)}>Save</button>
                                            <button className="btn btn-secondary btn-sm" onClick={handleCancelClick}>Cancel</button>
                                        </>
                                    ) : (
                                        // --- Buttons when NOT in EDITING Mode ---
                                        <>
                                            {/* Edit Button */}
                                            <button className="btn btn-secondary btn-sm me-2" onClick={() => handleEditClick(block)}>Edit</button>
                                            {/* Delete Button */}
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(block._id)}>Delete</button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                     </ul>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default ScheduleDisplay;
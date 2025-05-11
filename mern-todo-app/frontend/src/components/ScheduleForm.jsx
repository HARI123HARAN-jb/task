// frontend/src/components/ScheduleForm.jsx
import React, { useState } from 'react';

// This component provides the form for manually inputting schedule blocks or creating the initial schedule.
// It receives onAddBlock and onCreateSchedule functions as props from SchedulePage.jsx.
function ScheduleForm({ onAddBlock, onCreateSchedule, scheduleExists, loading }) { // Added loading prop
    // State for input fields for a single schedule block
    const [day, setDay] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [activity, setActivity] = useState('');
    const [location, setLocation] = useState('');
    const [tag, setTag] = useState(''); // For the block tag

    // State for the initial schedule name if creating the first schedule
    const [scheduleName, setScheduleName] = useState('My Weekly Schedule');


    const handleBlockSubmit = (e) => {
        e.preventDefault();

        // Basic validation for a schedule block
        if (!day || !startTime || !endTime || !activity) {
            alert("Please fill in Day, Start Time, End Time, and Activity.");
            return;
        }

        // Prepare block data object
        const blockData = {
            day,
            startTime,
            endTime,
            activity,
            location: location.trim() || undefined, // Use undefined if empty after trim
            tag: tag.trim() || undefined,           // Use undefined if empty after trim
        };

        if (scheduleExists) {
            // If a schedule exists, call the function to add this block to it
            onAddBlock(blockData);
        } else {
            // If no schedule exists, call the function to create the initial schedule
            onCreateSchedule({
                 name: scheduleName.trim() || 'My Weekly Schedule', // Use default name if empty
                 blocks: [blockData] // Include the first block in the initial schedule
            });
        }

        // Clear form fields after submission regardless of success/failure
        // Consider clearing only on success in a real app, but this simplifies things now
        setDay('');
        setStartTime('');
        setEndTime('');
        setActivity('');
        setLocation('');
        setTag('');
         if (!scheduleExists) {
            setScheduleName('My Weekly Schedule'); // Reset name after creating
        }
    };


  return (
    <form onSubmit={handleBlockSubmit}>
      {/* Input for initial schedule name if creating the first schedule */}
       {!scheduleExists && (
           <div className="mb-3">
               <label htmlFor="scheduleName" className="form-label">Schedule Name:</label>
               <input
                    type="text"
                    className="form-control"
                    id="scheduleName"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    required={!scheduleExists} // Make name required only if creating
                    disabled={loading} // Disable while loading
               />
           </div>
       )}

      {/* Inputs for a single schedule block */}
      <div className="row g-3"> {/* Use Bootstrap grid for layout */}
          <div className="col-md-6">
              <label htmlFor="blockDay" className="form-label">Day:</label>
               <select id="blockDay" className="form-select" value={day} onChange={(e) => setDay(e.target.value)} required disabled={loading}>
                   <option value="">Select Day</option>
                   {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                       <option key={d} value={d}>{d}</option>
                   ))}
               </select>
          </div>
           <div className="col-md-3">
              <label htmlFor="blockStartTime" className="form-label">Start Time:</label>
              <input type="time" id="blockStartTime" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} required disabled={loading} />
          </div>
          <div className="col-md-3">
              <label htmlFor="blockEndTime" className="form-label">End Time:</label>
              <input type="time" id="blockEndTime" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} required disabled={loading} />
          </div>
           <div className="col-md-6">
              <label htmlFor="blockActivity" className="form-label">Activity:</label>
              <input type="text" id="blockActivity" className="form-control" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g., Online Lecture" required disabled={loading} />
          </div>
           <div className="col-md-3">
              <label htmlFor="blockLocation" className="form-label">Location (Optional):</label>
              <input type="text" id="blockLocation" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Zoom" disabled={loading} />
          </div>
           <div className="col-md-3">
              <label htmlFor="blockTag" className="form-label">Tag (Optional):</label> {/* Updated label to Tag */}
              <input type="text" id="blockTag" className="form-control" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g., University, Hobby" disabled={loading} />
          </div>
      </div>
       <div className="mt-3">
           <button type="submit" className="btn btn-primary w-100" disabled={loading}> {/* Disable button while loading */}
               {scheduleExists ? 'Add Block' : 'Create Schedule & Add First Block'} {/* Button text changes based on whether schedule exists */}
           </button>
       </div>
    </form>
  );
}

export default ScheduleForm;
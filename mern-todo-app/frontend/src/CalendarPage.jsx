// frontend/src/CalendarPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {
  parse, startOfWeek, getDay, isValid, parseISO, toDate,
  setHours, setMinutes, setDay, addWeeks, addDays, isBefore,
  isSameDay,
  startOfDay, endOfDay, addYears, subYears,
  isFuture,
  isEqual,
  format,
} from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useTodos } from './TodoContext';
import { useAuth } from './UserContext';
import axios from 'axios';

const SCHEDULE_API_URL = 'http://localhost:5000/api/schedules';

const locales = { 'en-US': enUS, };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });


function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');

  const [events, setEvents] = useState([]); // Keep this state as provided by user

  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState(null);

  const { todos, loading: todosLoading, error: todosError } = useTodos();
  const { user } = useAuth();

  const fetchSchedules = async () => {
      if (!user || !user.token) { console.log("No authenticated user."); setSchedules([]); setSchedulesError(null); setSchedulesLoading(false); return; }
      try {
        setSchedulesLoading(true); setSchedulesError(null);
        const response = await axios.get(SCHEDULE_API_URL, { headers: { 'Authorization': `Bearer ${user.token}` } });
        setSchedules(response.data); console.log("Fetch schedules successful.");
      } catch (error) {
        console.error('Error fetching schedules:', error);
        if (error.response?.status === 401) setSchedulesError('Session expired. Log in.'); else setSchedulesError('Failed to fetch schedules.');
      } finally { setSchedulesLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, [user]);


  const calendarEvents = useMemo(() => {
    console.log("Generating calendar events...");
    const formattedEvents = [];
    if (todos && todos.length > 0) {
      todos.forEach(todo => {
        if (todo.dueDate) {
          try {
            const dueDateObj = parseISO(todo.dueDate);
            if (isValid(dueDateObj)) {
               formattedEvents.push({
                 title: `${todo.text}${todo.completed ? ' (Completed)' : ''}`,
                 start: dueDateObj, end: dueDateObj, allDay: true,
                 resource: { type: 'task', completed: todo.completed, todoId: todo._id, tag: todo.tag }
               });
            } else { console.warn("Invalid dueDate:", todo.text, todo.dueDate); }
          } catch (error) { console.error("Error processing dueDate:", todo.text, todo.dueDate, error); }
        }
      });
    }

    const today = new Date();
    const startDate = subYears(startOfDay(today), 1);
    const endDate = addYears(endOfDay(today), 1);
    const dayOfWeekMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, };

    if (schedules && schedules.length > 0) {
        schedules.forEach(schedule => {
            if (schedule.blocks && schedule.blocks.length > 0) {
                schedule.blocks.forEach(block => {
                    const targetDayOfWeek = dayOfWeekMap[block.day];
                     if (targetDayOfWeek === undefined) { console.warn("Invalid day of week:", block); return; }

                    let currentDate = setDay(startDate, targetDayOfWeek);
                    if (isBefore(currentDate, startOfDay(startDate))) { currentDate = addWeeks(currentDate, 1); }

                    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
                         try {
                            const [startHour, startMinute] = block.startTime.split(':').map(Number);
                            const [endHour, endMinute] = block.endTime.split(':').map(Number);
                            const eventStart = setMinutes(setHours(currentDate, startHour), startMinute);
                            let eventEnd = setMinutes(setHours(currentDate, endHour), endMinute);
                             if (isBefore(eventEnd, eventStart)) { eventEnd = addDays(eventEnd, 1); }

                            formattedEvents.push({
                                title: block.activity, start: eventStart, end: eventEnd, allDay: false,
                                resource: { type: 'schedule', scheduleId: schedule._id, blockId: block._id, day: block.day, startTime: block.startTime, endTime: block.endTime, }
                            });
                         } catch (error) { console.error("Error generating schedule block:", block, error); } finally { currentDate = addWeeks(currentDate, 1); }
                    }
                });
            }
        });
         console.log("Finished processing schedules. Total schedule events generated:", formattedEvents.filter(e => e.resource.type === 'schedule').length);
    } else {
         console.log("No schedules or schedule blocks found.");
    }

    formattedEvents.sort((a, b) => a.start - b.start);
    setEvents(formattedEvents); // Keep this state update as provided by user


    console.log("Total events:", formattedEvents.length);
    return formattedEvents; // Return the combined and sorted array

  }, [todos, schedules]);


  // --- ADDED: Find the single next upcoming event for the Ambient Information Widget ---
  // MOVED: This useMemo is now at the top level
  const nextUpcomingEvent = useMemo(() => {
      console.log("Finding next upcoming event from all events...");
      const now = new Date();

      const nextEvent = calendarEvents.find(event =>
         isFuture(event.start) || isEqual(event.start, now)
      );

       console.log("Next upcoming event found:", nextEvent?.title, nextEvent?.start);
      return nextEvent;

  }, [calendarEvents]); // Dependency on calendarEvents


  // --- ADDED: Calculate flags for message rendering at the top level ---
  // MOVED: Logic from useMemos inside render is now here
  const isLoading = todosLoading || schedulesLoading;
  const hasErrors = todosError || schedulesError;
  const hasAnyEvents = calendarEvents.length > 0;
  const hasUpcomingEvents = !!nextUpcomingEvent; // Check if nextUpcomingEvent exists
  // --- End ADDED flags ---


  const handleNavigate = (newDate) => { console.log("Calendar navigated to date:", newDate); setCurrentDate(newDate); };
  const handleView = (newView) => { console.log("Calendar view changed to:", newView); setCurrentView(newView); };

  const eventPropGetter = (event, start, end, isSelected) => {
      let newStyle = { backgroundColor: '#f0f0f0', color: 'black', borderRadius: '0px', border: 'none', };
      if (event.resource) {
          if (event.resource.type === 'task') {
              if (event.resource.completed) { newStyle.backgroundColor = '#d4edda'; newStyle.color = '#155724'; newStyle.border = '1px solid #c3e6cb'; }
              else { newStyle.backgroundColor = '#cfe2ff'; newStyle.color = '#084298'; newStyle.border = '1px solid #b9d0f2'; }
          } else if (event.resource.type === 'schedule') {
              newStyle.backgroundColor = '#fff3cd'; newStyle.color = '#664d03'; newStyle.border = '1px solid #ffecb5';
          }
      }
      return { className: '', style: newStyle };
  };


  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Calendar View</h1>

      {/* Use the flags calculated at the top level */}
      {isLoading && <p className="text-center">Loading calendar data...</p>}
      {hasErrors && <div className="alert alert-danger" role="alert">{todosError || schedulesError}</div>}

      {/* --- ADDED: Display the Ambient Information Widget (In-App Summary) --- */}
      {/* Only show if not loading, no errors, and there's a next upcoming event */}
      {!isLoading && !hasErrors && hasUpcomingEvents && ( // Use flags here
          <div className="card mb-3">
              <div className="card-header bg-info text-white">
                  Next Upcoming:
              </div>
              <div className="card-body">
                  <h5 className="card-title">{nextUpcomingEvent.title}</h5>
                  <p className="card-text">
                      {nextUpcomingEvent.allDay
                         ? `Due Date: ${format(nextUpcomingEvent.start, 'PPP')}`
                         : `Starts: ${format(nextUpcomingEvent.start, 'PPpp')}`
                      }
                       {!nextUpcomingEvent.allDay && nextUpcomingEvent.start.getTime() !== nextUpcomingEvent.end.getTime() &&
                           <span>{` - ${format(nextUpcomingEvent.end, 'p')}`}</span>
                       }
                  </p>
                    <p className="card-text text-muted"><small>Type: {nextUpcomingEvent.resource?.type === 'task' ? 'Task' : 'Schedule Block'}</small></p>
              </div>
          </div>
      )}
       {/* --- End ADDED Ambient Information Widget --- */}


      {/* Render the Big Calendar component */}
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents} // Use the result of the calendarEvents useMemo
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          selectable
          onSelectEvent={event => alert(`Event Clicked: ${event.title} (Type: ${event.resource?.type})`)}
          onSelectSlot={slotInfo => console.log("Selected Slot:", slotInfo)}
          date={currentDate}
          view={currentView}
          onNavigate={handleNavigate}
          onView={handleView}
          defaultView="week"
          views={['month', 'week', 'day', 'agenda']}
          style={{ height: 600 }}
          eventPropGetter={eventPropGetter}
        />
      </div>

       {/* Messages based on loading, errors, and presence of upcoming events */}
       {/* Use the flags calculated at the top level */}
        {!isLoading && !hasErrors && hasAnyEvents && !hasUpcomingEvents && ( // Use flags here
             <p className="text-center">No *upcoming* tasks with due dates or schedule blocks found.</p>
        )}
         {!isLoading && !hasErrors && !hasAnyEvents && ( // Use flags here
              <p className="text-center">No tasks with due dates or schedule blocks to display.</p>
          )}

    </div>
  );
}

export default CalendarPage;
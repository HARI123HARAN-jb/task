// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useTodos, getTaskNotifications } from './TodoContext';

// Import all page components used in routing
import TaskCreationPage from './TaskCreationPage';
import TaskViewPage from './TaskViewPage';
import SummaryPage from './SummaryPage';
import SchedulePage from './SchedulePage';
import ProfilePage from './ProfilePage';
import CalendarPage from './CalendarPage'; // Import the CalendarPage
import AdminUserManagementPage from './AdminUserManagementPage'; // Import Admin User Management Page
import AdminTeamManagementPage from './AdminTeamManagementPage'; // Import Admin Team Management Page
import AdminAIChatPage from './AdminAIChatPage'; // Import the Admin AI Chat Page
import UserChatPage from './UserChatPage'; // Import the User Chat Page
import GroupChatPage from './GroupChatPage'; // Import the Group Chat Page
import MyTeamsPage from './MyTeamsPage'; // Import the MyTeamsPage (to be created)

// Import Authentication pages
import LoginPage from './LoginPage'; // Make sure LoginPage is imported
import SignupPage from './SignupPage'; // Make sure SignupPage is imported

// Import the custom auth hook from UserContext
import { useAuth } from './UserContext'; // Assuming UserContext.jsx is in the same directory

// Import global styles if you have any
// import './App.css'; // Example: Uncomment if you have this file

import AIAssistant from './components/AIAssistant';

// Add a new Sidebar component import (to be created)
import SidebarDock from './components/SidebarDock';
import { NotificationProvider } from './NotificationContext';
import NotificationPopup from './components/NotificationPopup';
import NotificationSettingsPage from './NotificationSettingsPage';

function App() {
  // Consume the user object, isAdmin helper, and logout function from the authentication context
  const { user, isAdmin, logout, authLoading } = useAuth(); // Destructure user, isAdmin, logout, and authLoading
  const { todos } = useTodos();
  const taskNotifications = user ? getTaskNotifications(todos) : [];

  // Handler for the logout button click
  const handleLogout = () => {
      logout(); // Call the logout function provided by useAuth
      // The UserContext handles clearing Local Storage and updating the user state to null.
      // React Router will automatically re-evaluate routes based on the updated 'user' state.
      // Optional: You could add a specific redirect here if needed,
      // but the Navigate components in the Routes handle it based on auth status.
  };

  // Show a loading indicator while the authentication status is being determined on initial load
  // This prevents flickering or incorrect redirects
  if (authLoading) {
      return <div className="text-center mt-5">Loading authentication status...</div>;
  }


  return (
    <NotificationProvider>
      <NotificationPopup />
      <>
        {/* Sidebar Dock for navigation */}
        {user && <SidebarDock isAdmin={isAdmin} />}
        <div style={{ marginLeft: user ? 80 : 0 }}>
          {/* --- Navigation Bar (Navbar) --- */}
          {/* Using Bootstrap classes for styling */}
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
              {/* Brand link - usually links to the default authenticated route */}
              <Link className="navbar-brand" to="/">Taskflow</Link>

              {/* Navbar toggler for mobile responsiveness */}
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>

              {/* Navbar links container */}
              <div className="collapse navbar-collapse" id="navbarNav">
                {/* Main navigation links - shown only if a user is logged in */}
                {/* Use me-auto (margin-end: auto) to push the following items to the right */}
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  {/* Only show these links if the user is logged in */}
                  {user && (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" to="/tasks">View Tasks</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/tasks/new">Create Task</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/summary">Summary</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/schedule">Schedule</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/profile">Profile</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/calendar">Calendar</Link>
                      </li>
                    </>
                  )}
                </ul>

                {/* Authentication/User links - aligned to the right */}
                 <ul className="navbar-nav mb-2 mb-lg-0">
                   {/* Show these links/elements based on authentication status */}
                   {user ? (
                       // Show these if the user IS authenticated
                       <>
                           <li className="nav-item">
                                 {/* Display the logged-in username and role */}
                               <span className="nav-link disabled">Logged in as {user.name} ({user.role})</span>
                           </li>
                           <li className="nav-item">
                               {/* Logout button */}
                               <button className="btn btn-outline-danger ms-2" onClick={handleLogout}>Logout</button>
                           </li>
                       </>
                   ) : (
                       // Show these if the user is NOT authenticated
                       <>
                           <li className="nav-item">
                               <Link className="nav-link" to="/login">Login</Link>
                           </li>
                           <li className="nav-item">
                               <Link className="nav-link" to="/signup">Sign Up</Link>
                           </li>
                       </>
                   )}
                 </ul>

              </div>
            </div>
          </nav>

          {/* --- Main Content Area --- */}
          {/* This is where the components for each route will be rendered */}
          {/* Using a Bootstrap container for centering and padding */}
          <div className="container mt-4">
            {/* Task Deadline Notifications */}
            {taskNotifications && taskNotifications.length > 0 && (
              <div className="mb-3">
                {taskNotifications.map((notif, idx) => (
                  <div key={idx} className={`alert alert-${notif.type}`}>{notif.message}</div>
                ))}
              </div>
            )}
            {/* Define the application's routes */}
            <Routes>
              {/* --- Public Routes (Accessible to everyone) --- */}
              {/* The Login and Signup pages should be accessible even if not logged in */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              {/* Notification Settings route */}
              <Route path="/settings" element={<NotificationSettingsPage />} />

              {/* --- Protected Routes (Accessible only if 'user' is not null) --- */}
              {/* For protected routes, we check if 'user' exists. If not, we use <Navigate> to redirect to /login */}

              {/* Root path redirection: Redirect to /tasks if logged in, otherwise redirect to /login */}
              <Route path="/" element={user ? <Navigate to="/tasks" replace /> : <Navigate to="/login" replace />} />

              {/* Protected Task Routes */}
              {/* Render TaskViewPage IF user exists, otherwise Navigate to /login */}
              <Route path="/tasks" element={user ? <TaskViewPage /> : <Navigate to="/login" replace />} />
              {/* Render TaskCreationPage IF user exists, otherwise Navigate to /login */}
              <Route path="/tasks/new" element={user ? <TaskCreationPage /> : <Navigate to="/login" replace />} />

              {/* Protected Summary Route */}
               <Route path="/summary" element={user ? <SummaryPage /> : <Navigate to="/login" replace />} />

              {/* Protected Schedule Route */}
               <Route path="/schedule" element={user ? <SchedulePage /> : <Navigate to="/login" replace />} />

                {/* Protected Profile route */}
                <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />

                {/* Protected Calendar route */}
                <Route path="/calendar" element={user ? <CalendarPage /> : <Navigate to="/login" replace />} />

               {/* --- Admin-only Routes --- */}
               {/* Render AdminUserManagementPage IF user is Admin, otherwise Navigate to tasks or login */}
               {/* The component itself also performs the isAdmin check and redirects */}
                <Route
                    path="/admin/users"
                    element={user ? ( // First check if logged in at all
                        isAdmin ? ( // Then check if Admin
                             <AdminUserManagementPage /> // Render the Admin User Management page
                        ) : (
                             <Navigate to="/tasks" replace /> // Logged in but not Admin, redirect to tasks
                        )
                    ) : (
                        <Navigate to="/login" replace /> // Not logged in, redirect to login
                    )}
                />
                {/* Route for Admin Team Management Page */}
                 <Route
                     path="/admin/teams"
                     element={user ? ( // First check if logged in at all
                         isAdmin ? ( // Then check if Admin
                              <AdminTeamManagementPage /> // Render the Admin Team Management page
                         ) : (
                              <Navigate to="/tasks" replace /> // Logged in but not Admin, redirect to tasks
                         )
                     ) : (
                         <Navigate to="/login" replace /> // Not logged in, redirect to login
                     )}
                 />
               {/* --- End Admin-only Routes --- */}

               {/* User/Admin Chat Page (all users) */}
               <Route path="/chat" element={user ? <UserChatPage /> : <Navigate to="/login" replace />} />
               {/* User/Admin Group Chat Page (all users) */}
               <Route path="/group-chat" element={user ? <GroupChatPage /> : <Navigate to="/login" replace />} />

               {/* Protected My Teams route */}
               <Route path="/my-teams" element={user ? <MyTeamsPage /> : <Navigate to="/login" replace />} />

              {/* Optional: Add a catch-all route for any path that doesn't match the ones above */}
              {/* <Route path="*" element={user ? <Navigate to="/tasks" replace /> : <Navigate to="/login" replace />} /> */}
            </Routes>
          </div>
          {/* Add the floating AI Assistant for Admins */}
          <AIAssistant />
        </div>
      </>
    </NotificationProvider>
  );
}

export default App; // Export the App component

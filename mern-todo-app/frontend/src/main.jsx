// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing
import { TodoProvider } from './TodoContext.jsx'; // Import TodoProvider
import { UserProvider } from './UserContext.jsx'; // Import UserProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap with UserProvider first */}
    <UserProvider>
      {/* Wrap with BrowserRouter for routing */}
      <BrowserRouter>
        {/* Wrap with TodoProvider - place it here so it can access user context if needed later */}
        <TodoProvider>
          <App /> {/* App contains the Navbar and Routes */}
        </TodoProvider>
      </BrowserRouter>
    </UserProvider>
  </React.StrictMode>,
);
// frontend/src/ProfilePage.jsx
import React from 'react';
import { useAuth } from './UserContext';

function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          You need to be logged in to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">User Profile</h1>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="card-body">
          <h5 className="card-title">Welcome, {user.username}!</h5>
          <p className="card-text">Here is your profile information.</p>
          <ul className="list-group list-group-flush mt-3">
            <li className="list-group-item"><strong>Username:</strong> {user.username}</li>
            <li className="list-group-item"><strong>User ID:</strong> {user._id}</li>
            {user.name && <li className="list-group-item"><strong>Name:</strong> {user.name}</li>}
            {user.email && <li className="list-group-item"><strong>Email:</strong> {user.email}</li>}
            {user.createdAt && (
              <li className="list-group-item"><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</li>
            )}
            {user.role && <li className="list-group-item"><strong>Role:</strong> {user.role}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
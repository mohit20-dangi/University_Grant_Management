// src/Dashboard.js
import React from 'react';
import { Link, useNavigate, Outlet,useLocation } from 'react-router-dom'; // <-- Import Outlet
import './DashboardLayout.css';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get the logged-in user's info from localStorage
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');

  const getPageTitle = () => {
    switch (location.pathname) {
          // --- Shared Routes ---
          case '/dashboard':
            return userRole === 'admin' ? 'Admin Dashboard' : 'My Dashboard';
          case '/dashboard/publications/new':
            return 'Create Publication';
          case '/dashboard/equipment':
            return 'Explore Equipment';

          // --- Researcher Routes ---
          case '/dashboard/researchers':
            return 'View Researchers';
          case '/dashboard/usage/new':
            return 'Log Equipment Usage';

          // --- Admin Routes ---
          case '/dashboard/usage-log':
            return 'All Equipment Usage Log';
          case '/dashboard/projects/new':
            return 'Create Project';
          case '/dashboard/researchers/manage':
            return 'Manage Researchers';
          case '/dashboard/agencies/manage':
            return 'Manage Agencies';
          case '/dashboard/grants/manage':
            return 'Manage Grants';
            
          default:
            return 'Dashboard';
    }
  };
  const pageTitle = getPageTitle();

  const handleLogout = () => {
    // Clear the user's session
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    
    // Redirect to the login page
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* --- Sidebar --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo-link">
            <div className="sidebar-logo">
              <span role="img" aria-label="logo" style={{ fontSize: '24px' }}>📊</span>
              <h2>ResearchHub</h2>
            </div>
          </Link>
        </div>

        {/* --- DYNAMIC NAVIGATION MENU --- */}
        <nav className="nav-menu">
          {userRole === 'admin' ? (
            <>
              {/* --- Admin Links --- */}
              <Link to="/dashboard">Admin Dashboard</Link>
              
              {/* --- New Links from Researcher Side --- */}
              <Link to="/dashboard/publications/new">Create Publication</Link>
              <Link to="/dashboard/equipment">Explore Equipment</Link>
              <Link to="/dashboard/usage/new">Log Equipment Usage</Link>

              {/* --- New Link for Admin Usage Page --- */}
              <Link to="/dashboard/usage-log">All Equipment Usage Log</Link>
              <Link to="/dashboard/projects/manage">Manage Project</Link>
              <Link to="/dashboard/researchers/manage">Manage Researchers</Link>
              <Link to="/dashboard/agencies/manage">Manage Agencies</Link>
              <Link to="/dashboard/grants/manage">Manage Grants</Link>
            </>
          ) : (
            <>
              {/* --- Researcher Links (Updated) --- */}
              <Link to="/dashboard">My Dashboard</Link>
              <Link to="/dashboard/researchers">View Researchers</Link>
              <Link to="/dashboard/usage/new">Log Equipment Usage</Link>
              <Link to="/dashboard/publications/new">Create Publication</Link>
              <Link to="/dashboard/equipment">Explore Equipment</Link>
            </>
          )}
        </nav>

        {/* --- Logout Button --- */}
        <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
          <button 
            className="btn-login-main" 
            style={{ width: '100%', backgroundColor: '#f5576c' }} 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="main-content">
        <div className="top-bar">
          <h1>{pageTitle}</h1>
          <div style={{ color: '#111111', fontWeight: '500' }}>
            Welcome, <strong>{userName}</strong> ({userRole})
          </div>
        </div>

        <div className="admin-content">
          {/* This <Outlet> is the "window" where all our child 
            routes (pages) will be rendered.
          */}
          <Outlet /> {/* <-- THIS IS THE EMPTY WINDOW */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
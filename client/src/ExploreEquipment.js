// src/ExploreEquipment.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardLayout.css'; // Use the layout and styles

function ExploreEquipment() {
  // --- React State ---
  const [equipment, setEquipment] = useState([]);

  // --- Data Fetching (on page load) ---
  useEffect(() => {
    fetch('http://localhost:5000/api/equipment/details')
      .then(response => response.json())
      .then(data => setEquipment(data))
      .catch(error => console.error('Error loading equipment:', error));
  }, []);

  // --- Render ---
  return (
    <div className="dashboard-container">
      {/* --- Sidebar (Public) --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo-link">
            <div className="sidebar-logo">
              <span role="img" aria-label="logo" style={{ fontSize: '24px' }}>📊</span>
              <h2>ResearchHub</h2>
            </div>
          </Link>
        </div>
        <nav className="nav-menu">
          <Link to="/projects">Explore Projects</Link>
          <Link to="/departments">Explore Departments</Link>
          <Link to="/publications">Explore Publications</Link>
          <Link to="/agencies">Explore Agencies</Link>
          <Link to="/equipment" className="active">Explore Equipment</Link>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <div className="main-content">
        <div className="top-bar">
          <h1>Explore Equipment</h1>
          <Link to="/login" className="btn-login-main">Login</Link>
        </div>

        <div className="page-content">
          <div className="content-header">
            <h2>All Equipment</h2>
          </div>

          <div id="projectsList" className="projects-grid">
            {equipment.length === 0 ? (
              <p>No equipment found.</p>
            ) : (
              equipment.map(item => (
                <div key={item.equipment_id} className="project-card">
                  <h3>{item.equipment_name}</h3>
                  <p>Model: <strong>{item.model || 'N/A'}</strong></p>
                  <div className="project-meta">
                    <span>Managed by: {item.managed_by_dept || 'N/A'}</span>
                  </div>
                  {/* No "View More" button as requested */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExploreEquipment;
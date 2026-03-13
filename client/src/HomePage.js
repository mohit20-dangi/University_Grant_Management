// src/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DashboardLayout.css'; // Import the new styles

function HomePage() {
  const navigate = useNavigate();

  // State for our stats
  const [projectCount, setProjectCount] = useState(0);
  const [publicationCount, setPublicationCount] = useState(0);
  const [researcherCount, setResearcherCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  // We'll add agencies and equipment later

  useEffect(() => {
    // Fetch project count
    fetch('http://localhost:5000/api/projects')
      .then(res => res.json())
      .then(data => setProjectCount(data.length || 0))
      .catch(err => console.error("Failed to fetch projects:", err));

    // Fetch publication count
    fetch('http://localhost:5000/api/publications')
      .then(res => res.json())
      .then(data => setPublicationCount(data.length || 0))
      .catch(err => console.error("Failed to fetch publications:", err));

    // Fetch researcher count
    fetch('http://localhost:5000/api/researchers')
      .then(res => res.json())
      .then(data => setResearcherCount(data.length || 0))
      .catch(err => console.error("Failed to fetch researchers:", err));

    // Fetch department count
    fetch('http://localhost:5000/api/departments')
      .then(res => res.json())
      .then(data => setDepartmentCount(data.length || 0))
      .catch(err => console.error("Failed to fetch departments:", err));

  }, []); // The empty array ensures this runs only once


  const handleLoginClick = () => {
    navigate('/login'); // Navigate to the login page
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          {/* Wrap the logo in a Link to the homepage */}
          <Link to="/" className="sidebar-logo-link">
            <div className="sidebar-logo">
              <span role="img" aria-label="logo" style={{ fontSize: '24px' }}>📊</span>
              <h2>ResearchHub</h2>
            </div>
          </Link>
        </div>
        <nav className="nav-menu">
          {/* Updated sidebar links */}
          <Link to="/projects">Explore Projects</Link>
          <Link to="/departments">Explore Departments</Link>
          <Link to="/publications">Explore Publications</Link>
          <Link to="/agencies">Explore Agencies</Link>
          <Link to="/equipment">Explore Equipment</Link>
        </nav>
      </aside>

      <div className="main-content">
        <div className="top-bar">
          <h1>Research Overview</h1>
          <button className="btn-login-main" onClick={handleLoginClick}>
            Login
          </button>
        </div>

        <div className="admin-content">
          <p className="page-subtitle">Public information about our research activities</p>

          <div className="stats-grid">
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h3>Research Projects</h3>
              <div className="stat-number">{projectCount}</div>
              <div className="stat-change">Active and completed</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <h3>Publications</h3>
              <div className="stat-number">{publicationCount}</div>
              <div className="stat-change">Research outputs</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <h3>Researchers</h3>
              <div className="stat-number">{researcherCount}</div>
              <div className="stat-change">Active members</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <h3>Departments</h3>
              <div className="stat-number">{departmentCount}</div>
              <div className="stat-change">Research units</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
// src/ExploreAgencies.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardLayout.css'; // Use the layout and styles

function ExploreAgencies() {
  // --- React State ---
  const [agencies, setAgencies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    details: null,
    grants: []
  });

  // --- Data Fetching (on page load) ---
  useEffect(() => {
    fetch('http://localhost:5000/api/agencies/details')
      .then(response => response.json())
      .then(data => setAgencies(data))
      .catch(error => console.error('Error loading agencies:', error));
  }, []);

  // --- Modal Functions ---
  const handleViewMore = async (agency) => {
    // Set modal state
    setModalData({ details: agency, grants: [] });
    setIsModalOpen(true);

    try {
      // Fetch grants for this agency
      const res = await fetch(`http://localhost:5000/api/agencies/${agency.agency_id}/grants`);
      const grantsData = await res.json();

      setModalData(prevData => ({
        ...prevData,
        grants: grantsData
      }));
    } catch (error) {
      console.error('Error loading agency details:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

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
          <Link to="/agencies" className="active">Explore Agencies</Link>
          <Link to="/equipment">Explore Equipment</Link>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <div className="main-content">
        <div className="top-bar">
          <h1>Explore Agencies</h1>
          <Link to="/login" className="btn-login-main">Login</Link>
        </div>

        <div className="page-content">
          <div className="content-header">
            <h2>All Funding Agencies</h2>
          </div>

          <div id="projectsList" className="projects-grid">
            {agencies.length === 0 ? (
              <p>No agencies found.</p>
            ) : (
              agencies.map(agency => (
                <div key={agency.agency_id} className="project-card">
                  <h3>{agency.name}</h3>
                  <p>Type: <strong>{agency.type || 'N/A'}</strong></p>
                  <div className="project-meta">
                    <span>Contact: {agency.contact || 'N/A'}</span>
                  </div>
                  <button onClick={() => handleViewMore(agency)} className="btn-secondary">
                    View Grants
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Details Modal --- */}
      {isModalOpen && modalData.details && (
        <div id="projectModal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <h2>{modalData.details.name}</h2>
            <div id="projectDetails">
              <p><strong>Type:</strong> {modalData.details.type || 'N/A'}</p>
              <p><strong>Contact:</strong> {modalData.details.contact || 'N/A'}</p>

              <h4>Grants Provided:</h4>
              <ul>
                {modalData.grants.length > 0 ? (
                  modalData.grants.map(grant => (
                    <li key={grant.grant_id}>
                      <strong>{grant.title}</strong> ({grant.year}) - ₹{Number(grant.amount).toLocaleString()}
                    </li>
                  ))
                ) : (
                  <li>No grants listed for this agency.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExploreAgencies;
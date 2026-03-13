// src/ExplorePublications.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardLayout.css'; // Use the layout and styles

function ExplorePublications() {
  // --- React State ---
  const [publications, setPublications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    details: null,
    authors: [],
    project: null
  });

  // --- Data Fetching (on page load) ---
  useEffect(() => {
    fetch('http://localhost:5000/api/publications/details')
      .then(response => response.json())
      .then(data => setPublications(data))
      .catch(error => console.error('Error loading publications:', error));
  }, []);

  // --- Modal Functions ---
  const handleViewMore = async (publication) => {
    // Set modal state
    setModalData({ details: publication, authors: [], project: null });
    setIsModalOpen(true);

    try {
      // Fetch authors and project at the same time
      const [authorsRes, projectRes] = await Promise.all([
        fetch(`http://localhost:5000/api/publications/${publication.publication_id}/authors`),
        fetch(`http://localhost:5000/api/publications/${publication.publication_id}/project`)
      ]);

      const authorsData = await authorsRes.json();
      const projectData = await projectRes.json();

      setModalData(prevData => ({
        ...prevData,
        authors: authorsData,
        project: projectData[0] // Get the first related project
      }));
    } catch (error) {
      console.error('Error loading details:', error);
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
          <Link to="/publications" className="active">Explore Publications</Link>
          <Link to="/agencies">Explore Agencies</Link>
          <Link to="/equipment">Explore Equipment</Link>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <div className="main-content">
        <div className="top-bar">
          <h1>Explore Publications</h1>
          <Link to="/login" className="btn-login-main">Login</Link>
        </div>

        <div className="page-content">
          <div className="content-header">
            <h2>All Publications</h2>
          </div>

          <div id="projectsList" className="projects-grid">
            {publications.length === 0 ? (
              <p>No publications found.</p>
            ) : (
              publications.map(pub => (
                <div key={pub.publication_id} className="project-card">
                  <h3>{pub.title}</h3>
                  <p>Published in: <strong>{pub.journal || 'N/A'}</strong></p>
                  <div className="project-meta">
                    <span>Date: {pub.publication_date ? new Date(pub.publication_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <button onClick={() => handleViewMore(pub)} className="btn-secondary">
                    View More
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
            <h2>{modalData.details.title}</h2>
            <div id="projectDetails">
              <p><strong>Journal:</strong> {modalData.details.journal || 'N/A'}</p>
              <p><strong>Publication Date:</strong> {modalData.details.publication_date ? new Date(modalData.details.publication_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>DOI:</strong> {modalData.details.doi || 'Not available'}</p>

              <h4>Authors:</h4>
              <ul>
                {modalData.authors.length > 0 ? (
                  modalData.authors.map(author => (
                    <li key={author.name}>{author.name}</li>
                  ))
                ) : (
                  <li>No authors listed.</li>
                )}
              </ul>
              
              <h4>Related Project:</h4>
              {modalData.project ? (
                <p>{modalData.project.title}</p>
              ) : (
                <p>No project associated.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplorePublications;
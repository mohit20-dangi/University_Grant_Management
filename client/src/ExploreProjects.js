// src/ExploreProjects.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardLayout.css'; // Use the layout and new styles

function ExploreProjects() {
  // --- React State ---
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProject, setModalProject] = useState(null);
  const [modalMembers, setModalMembers] = useState([]);
  const [modalPublications, setModalPublications] = useState([]);

  // --- Data Fetching (on page load) ---
  useEffect(() => {
    fetch('http://localhost:5000/api/projects')
      .then(response => response.json())
      .then(data => setProjects(data))
      .catch(error => console.error('Error loading projects:', error));
  }, []);

  // --- Modal Functions ---
  const handleViewDetails = async (projectId) => {
    // Reset modal state
    setModalProject(null);
    setModalMembers([]);
    setModalPublications([]);
    setIsModalOpen(true);

    try {
      // Fetch project details and members at the same time
      const [projectRes, membersRes, pubsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/projects/${projectId}`),
        fetch(`http://localhost:5000/api/projects/${projectId}/members`),
        fetch(`http://localhost:5000/api/projects/${projectId}/publications`)
      ]);

      const projectData = await projectRes.json();
      const membersData = await membersRes.json();
      const pubsData = await pubsRes.json();

      setModalProject(projectData);
      setModalMembers(membersData);
      setModalPublications(pubsData);
    } catch (error) {
      console.error('Error loading project details:', error);
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
          {/* Wrap the logo in a Link to the homepage */}
          <Link to="/" className="sidebar-logo-link">
            <div className="sidebar-logo">
              <span role="img" aria-label="logo" style={{ fontSize: '24px' }}>📊</span>
              <h2>ResearchHub</h2>
            </div>
          </Link>
        </div>
        <nav className="nav-menu">
          <Link to="/projects" className="active">Explore Projects</Link>
          <Link to="/departments">Explore Departments</Link>
          <Link to="/publications">Explore Publications</Link>
          <Link to="/agencies">Explore Agencies</Link>
          <Link to="/equipment">Explore Equipment</Link>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <div className="main-content">
        <div className="top-bar">
          <h1>Explore Projects</h1>
          <Link to="/login" className="btn-login-main">Login</Link>
        </div>

        <div className="page-content">
          <div className="content-header">
            <h2>All Research Projects</h2>
            {/* "Create Project" button is hidden as this is a public page */}
          </div>

          <div id="projectsList" className="projects-grid">
            {projects.length === 0 ? (
              <p>No research projects found.</p>
            ) : (
              projects.map(project => (
                <div key={project.project_id} className="project-card">
                  <h3>{project.title}</h3>
                  <p>{project.abstract?.substring(0, 100) || "No description"}...</p>
                  <div className="project-meta">
                    <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                    <span>End: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}</span>
                  </div>
                  <button onClick={() => handleViewDetails(project.project_id)} className="btn-secondary">
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Project Modal --- */}
      {isModalOpen && (
        <div id="projectModal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <h2>Project Details</h2>
            <div id="projectDetails">
              {modalProject ? (
                <div>
                  <h3>{modalProject.title}</h3>
                  <p><strong>Abstract:</strong> {modalProject.abstract}</p>
                  <p><strong>Start Date:</strong> {new Date(modalProject.start_date).toLocaleDateString()}</p>
                  <p><strong>End Date:</strong> {modalProject.end_date ? new Date(modalProject.end_date).toLocaleDateString() : 'Ongoing'}</p>
                  <h4>Team Members:</h4>
                  <ul>
                    {modalMembers.length > 0 ? (
                      modalMembers.map(member => (
                        <li key={member.name}>{member.name} ({member.role || member.position})</li>
                      ))
                    ) : (
                      <li>No members assigned</li>
                    )}
                  </ul>
                  <h4>Related Publications:</h4>
                  <ul>
                    {modalPublications.length > 0 ? (
                      modalPublications.map(pub => (
                        <li key={pub.publication_id}>{pub.title}</li>
                      ))
                    ) : (
                      <li>No publications found for this project.</li>
                    )}
                  </ul>
                </div>
              ) : (
                <p>Loading details...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExploreProjects;
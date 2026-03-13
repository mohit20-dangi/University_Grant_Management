// src/DashboardHome.js
import React, { useState, useEffect } from 'react';
import './DashboardLayout.css'; // Reuse our layout styles

// Helper function to create authenticated headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// --- Main Component ---
function DashboardHome() {
  const [details, setDetails] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [myPublications, setMyPublications] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  // State for modals
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalFunding, setModalFunding] = useState([]);
  const [modalProjectTitle, setModalProjectTitle] = useState('');
  const [editingPub, setEditingPub] = useState(null); // Holds the pub to be edited

  // Fetch all data on component load
  useEffect(() => {
    // This headers object is CRITICAL. It proves you are logged in.
    const headers = { 
      'Authorization': `Bearer ${localStorage.getItem('token')}` 
    };

    // Fetch Researcher Details
    fetch('http://localhost:5000/api/researchers/me', { headers }) // <-- ADD { headers }
      .then(res => res.json())
      .then(data => setDetails(data))
      .catch(err => console.error("Error fetching details:", err));

    // Fetch My Projects
    fetch('http://localhost:5000/api/projects/my-projects', { headers }) // <-- ADD { headers }
      .then(res => res.json())
      .then(data => setMyProjects(data))
      .catch(err => console.error("Error fetching projects:", err));

    // Fetch My Publications
    fetch('http://localhost:5000/api/publications/my-publications', { headers }) // <-- ADD { headers }
      .then(res => res.json())
      .then(data => setMyPublications(data))
      .catch(err => console.error("Error fetching publications:", err));

    // Fetch My Collaborators
    fetch('http://localhost:5000/api/researchers/my-collaborators', { headers }) // <-- ADD { headers }
      .then(res => res.json())
      .then(data => setCollaborators(data))
      .catch(err => console.error("Error fetching collaborators:", err));
  }, []);

  // --- Modal Handlers ---

  // Project Funding Modal
  const handleViewFunding = async (project) => {
    setModalProjectTitle(project.title);
    setModalFunding([]);
    setIsFundingModalOpen(true);
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${project.project_id}/funding`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setModalFunding(data);
    } catch (err) {
      console.error("Error fetching funding:", err);
    }
  };

  // Edit Publication Modal
  const handleOpenEdit = (pub) => {
    // Format date for the <input type="date">
    const formattedPub = {
      ...pub,
      publication_date: pub.publication_date ? new Date(pub.publication_date).toISOString().split('T')[0] : ''
    };
    setEditingPub(formattedPub);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditingPub({ ...editingPub, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/publications/${editingPub.publication_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingPub)
      });
      const updatedPub = await res.json();
      
      // Update the publication in our state
      setMyPublications(myPublications.map(p => 
        p.publication_id === updatedPub.publication_id ? updatedPub : p
      ));
      setIsEditModalOpen(false);
      setEditingPub(null);
    } catch (err) {
      console.error("Error updating publication:", err);
    }
  };

  return (
    <div className="page-content">
      {/* --- 1. Researcher Details Section --- */}
      <div className="content-header">
        <h2>My Details</h2>
      </div>
      {details ? (
        <div className="info-box" style={{ marginBottom: '2rem' }}>
          <p><strong>Name:</strong> {details.name}</p>
          <p><strong>Email:</strong> {details.email}</p>
          <p><strong>Position:</strong> {details.position}</p>
          <p><strong>Department:</strong> {details.department_name}</p>
        </div>
      ) : (
        <p>Loading details...</p>
      )}

      {/* --- 2. "My Projects" Section --- */}
      <div className="content-header">
        <h2>My Projects</h2>
      </div>
      <div className="projects-grid">
        {myProjects.length > 0 ? (
          myProjects.map(project => (
            <div key={project.project_id} className="project-card">
              <h3>{project.title}</h3>
              <p>{project.abstract?.substring(0, 100) || "No description"}...</p>
              <div className="project-meta">
                <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                <span>End: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}</span>
              </div>
              <button onClick={() => handleViewFunding(project)} className="btn-secondary">
                View Funding
              </button>
            </div>
          ))
        ) : (
          <p>You are not assigned to any projects yet.</p>
        )}
      </div>

      {/* --- 3. "My Publications" Section --- */}
      <div className="content-header" style={{ marginTop: '2rem' }}>
        <h2>My Publications</h2>
      </div>
      <div className="projects-grid">
        {myPublications.length > 0 ? (
          myPublications.map(pub => (
            <div key={pub.publication_id} className="project-card">
              <h3>{pub.title}</h3>
              <p>Journal: <strong>{pub.journal || 'N/A'}</strong></p>
              <p>Date: {pub.publication_date ? new Date(pub.publication_date).toLocaleDateString() : 'N/A'}</p>
              <button onClick={() => handleOpenEdit(pub)} className="btn-secondary">
                Edit
              </button>
            </div>
          ))
        ) : (
          <p>You are not an author on any publications yet.</p>
        )}
      </div>

      {/* --- 4. "My Collaborators" Section --- */}
      <div className="content-header" style={{ marginTop: '2rem' }}>
        <h2>My Collaborators</h2>
      </div>
      <div className="projects-grid">
        {collaborators.length > 0 ? (
          collaborators.map(collab => (
            <div key={collab.researcher_id} className="project-card">
              <h3>{collab.name}</h3>
              <p>Email: {collab.email}</p>
              <div className="project-meta">
                <span>Dept: {collab.department_name || 'N/A'}</span>
              </div>
            </div>
          ))
        ) : (
          <p>No collaborators found.</p>
        )}
      </div>

      {/* --- Project Funding Modal --- */}
      {isFundingModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsFundingModalOpen(false)}>&times;</span>
            <h2>Funding for: {modalProjectTitle}</h2>
            <ul>
              {modalFunding.length > 0 ? (
                modalFunding.map(grant => (
                  <li key={grant.title}>
                    <strong>{grant.title}</strong> - ₹{Number(grant.amount).toLocaleString()}
                  </li>
                ))
              ) : (
                <li>No funding details found for this project.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* --- Edit Publication Modal --- */}
      {isEditModalOpen && editingPub && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsEditModalOpen(false)}>&times;</span>
            <h2>Edit Publication</h2>
            <form onSubmit={handleEditSubmit} className="login-form" style={{ maxWidth: 'none' }}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input type="text" name="title" value={editingPub.title} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="journal">Journal</label>
                <input type="text" name="journal" value={editingPub.journal} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label htmlFor="publication_date">Publication Date</label>
                <input type="date" name="publication_date" value={editingPub.publication_date} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label htmlFor="doi">DOI</label>
                <input type="text" name="doi" value={editingPub.doi} onChange={handleEditChange} />
              </div>
              <button type="submit" className="btn-login">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHome;
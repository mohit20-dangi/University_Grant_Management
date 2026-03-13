// src/ExploreDepartments.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardLayout.css'; // Use the layout and styles

function ExploreDepartments() {
  // --- React State ---
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalEquipment, setModalEquipment] = useState([]);

  // --- Data Fetching (on page load) ---
  useEffect(() => {
    fetch('http://localhost:5000/api/departments/details')
      .then(response => response.json())
      .then(data => setDepartments(data))
      .catch(error => console.error('Error loading departments:', error));
  }, []);

  // --- Modal Functions ---
  const handleViewDetails = async (deptId, deptName) => {
    // Set modal state
    setModalTitle(deptName);
    setModalEquipment([]);
    setIsModalOpen(true);

    try {
      // Fetch equipment for this department
      const res = await fetch(`http://localhost:5000/api/departments/${deptId}/equipment`);
      const data = await res.json();
      setModalEquipment(data);
    } catch (error) {
      console.error('Error loading equipment details:', error);
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
          <Link to="/departments" className="active">Explore Departments</Link>
          <Link to="/publications">Explore Publications</Link>
          <Link to="/agencies">Explore Agencies</Link>
          <Link to="/equipment">Explore Equipment</Link>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <div className="main-content">
        <div className="top-bar">
          <h1>Explore Departments</h1>
          <Link to="/login" className="btn-login-main">Login</Link>
        </div>

        <div className="page-content">
          <div className="content-header">
            <h2>All Departments</h2>
          </div>

          <div id="projectsList" className="projects-grid">
            {departments.length === 0 ? (
              <p>No departments found.</p>
            ) : (
              departments.map(dept => (
                <div key={dept.department_id} className="project-card">
                  <h3>{dept.department_name}</h3>
                  <div className="project-meta">
                    <span>HOD: {dept.hod_name || 'N/A'}</span>
                  </div>
                  <p>Number of Researchers: {dept.researcher_count}</p>
                  <button onClick={() => handleViewDetails(dept.department_id, dept.department_name)} className="btn-secondary">
                    View Equipment
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Equipment Modal --- */}
      {isModalOpen && (
        <div id="projectModal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <h2>Equipment in {modalTitle}</h2>
            <div id="projectDetails">
              <ul>
                {modalEquipment.length > 0 ? (
                  modalEquipment.map(equip => (
                    <li key={equip.equipment_id}>
                      {equip.equipment_name} (Model: {equip.model || 'N/A'})
                    </li>
                  ))
                ) : (
                  <li>No equipment managed by this department.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExploreDepartments;
// src/ViewEquipment.js
import React, { useState, useEffect } from 'react';

function ViewEquipment() {
  // --- React State ---
  const [equipment, setEquipment] = useState([]);

  // --- Data Fetching (on page load) ---
  useEffect(() => {
    // This is the same public API, which is fine
    fetch('http://localhost:5000/api/equipment/details')
      .then(response => response.json())
      .then(data => setEquipment(data))
      .catch(error => console.error('Error loading equipment:', error));
  }, []);

  // --- Render ---
  return (
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ViewEquipment;
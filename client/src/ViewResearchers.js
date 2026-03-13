// src/ViewResearchers.js
import React, { useState, useEffect } from 'react';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

function ViewResearchers() {
  // State for the data
  const [researchers, setResearchers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  
  // State for the filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPos, setSelectedPos] = useState('');
  const [showCollaborators, setShowCollaborators] = useState(false);

  // 1. Fetch filter options on component load
  useEffect(() => {
    fetch('http://localhost:5000/api/researchers/filters')
      .then(res => res.json())
      .then(data => {
        setDepartments(data.departments);
        setPositions(data.positions);
      })
      .catch(err => console.error("Error fetching filters:", err));
  }, []);

  // 2. Fetch researchers whenever filters change
  useEffect(() => {
    // Build query params
    const params = new URLSearchParams();
    if (selectedDept) params.append('department_id', selectedDept);
    if (selectedPos) params.append('position', selectedPos);
    if (showCollaborators) params.append('collaboratorsOnly', 'true');

    // Fetch data
    fetch(`http://localhost:5000/api/researchers/detailed?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResearchers(data);
        } else {
          setResearchers([]); // Handle errors
        }
      })
      .catch(err => console.error("Error fetching researchers:", err));
  
  }, [selectedDept, selectedPos, showCollaborators]); // Re-run this effect when filters change

  return (
    <div className="page-content">
      {/* --- Filter Bar --- */}
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="dept-filter">Department</label>
          <select id="dept-filter" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.department_id} value={dept.department_id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="pos-filter">Position</label>
          <select id="pos-filter" value={selectedPos} onChange={e => setSelectedPos(e.target.value)}>
            <option value="">All Positions</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <div className="filter-group-check">
          <input 
            type="checkbox" 
            id="collab-filter" 
            checked={showCollaborators} 
            onChange={e => setShowCollaborators(e.target.checked)} 
          />
          <label htmlFor="collab-filter">My Collaborators Only</label>
        </div>
      </div>

      {/* --- Researcher Cards Grid --- */}
      <div className="projects-grid">
        {researchers.length === 0 ? (
          <p>No researchers found matching your criteria.</p>
        ) : (
          researchers.map(r => (
            <div key={r.researcher_id} className="project-card">
              <h3>{r.name}</h3>
              <p>Position: <strong>{r.position || 'N/A'}</strong></p>
              <p>Email: {r.email}</p>
              <div className="project-meta">
                <span>Dept: {r.department_name || 'N/A'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ViewResearchers;
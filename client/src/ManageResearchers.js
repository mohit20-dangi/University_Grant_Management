// src/ManageResearchers.js
import React, { useState, useEffect } from 'react';
import './DashboardLayout.css'; // Use the layout and styles

const getToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

function ManageResearchers() {
  // Data state
  const [researchers, setResearchers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  
  // Filter state
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPos, setSelectedPos] = useState('');
  const [nameSearch, setNameSearch] = useState('');

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResearcher, setEditingResearcher] = useState(null);

  // --- Data Fetching ---
  // 1. Fetch filter options on load
  useEffect(() => {
    fetch('http://localhost:5000/api/researchers/filters')
      .then(res => res.json())
      .then(data => {
        setDepartments(data.departments);
        setPositions(data.positions);
      })
      .catch(err => console.error("Error fetching filters:", err));
  }, []);

  // 2. Fetch researchers when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedDept) params.append('department_id', selectedDept);
    if (selectedPos) params.append('position', selectedPos);
    if (nameSearch.length > 2) params.append('name', nameSearch); // Search after 2+ chars

    fetch(`http://localhost:5000/api/researchers/detailed?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setResearchers(data);
      else setResearchers([]);
    })
    .catch(err => console.error("Error fetching researchers:", err));
  
  }, [selectedDept, selectedPos, nameSearch]); // Re-run when filters change

  // --- Event Handlers ---
  const handleDelete = async (researcherId) => {
    if (!window.confirm('Are you sure you want to delete this researcher? This action is permanent.')) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/researchers/${researcherId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete');
      // Refresh list
      setResearchers(researchers.filter(r => r.researcher_id !== researcherId));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenEdit = (researcher) => {
    setEditingResearcher(researcher);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditingResearcher(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/researchers/${editingResearcher.researcher_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingResearcher)
      });
      if (!res.ok) throw new Error('Failed to update');
      const updatedResearcher = await res.json();
      
      // Update list and close modal
      setResearchers(researchers.map(r => 
        r.researcher_id === updatedResearcher.researcher_id ? updatedResearcher : r
      ));
      setIsEditModalOpen(false);
      setEditingResearcher(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page-content">
      {/* --- Filter Bar --- */}
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="name-filter">Name</label>
          <input
            type="text"
            id="name-filter"
            placeholder="Search by name..."
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
          />
        </div>
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
            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>
      </div>

      {/* --- Researcher Cards Grid --- */}
      <div className="projects-grid">
        {researchers.map(r => (
          <div key={r.researcher_id} className="project-card">
            <h3>{r.name}</h3>
            <p>Position: <strong>{r.position || 'N/A'}</strong></p>
            <p>Email: {r.email}</p>
            <div className="project-meta">
              <span>Dept: {r.department_name || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => handleOpenEdit(r)} className="btn-secondary">Edit</button>
              <button onClick={() => handleDelete(r.researcher_id)} className="btn-secondary" style={{ borderColor: '#f5576c', color: '#f5576c' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Edit Researcher Modal --- */}
      {isEditModalOpen && editingResearcher && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsEditModalOpen(false)}>&times;</span>
            <h2>Edit Researcher</h2>
            <form onSubmit={handleEditSubmit} className="login-form" style={{ maxWidth: 'none' }}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={editingResearcher.name} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={editingResearcher.email} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input type="text" name="position" value={editingResearcher.position} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select name="department" value={editingResearcher.department || ''} onChange={handleEditChange}>
                  <option value="">-- Select Department --</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-login">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageResearchers;
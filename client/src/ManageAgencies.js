// src/ManageAgencies.js
import React, { useState, useEffect } from 'react';
import './DashboardLayout.css'; // Use the layout and styles

// Helper to get auth token
const getToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

function ManageAgencies() {
  const [agencies, setAgencies] = useState([]);
  const [error, setError] = useState('');

  // State for the "Create New" form
  const [newAgency, setNewAgency] = useState({
    agency_id: 'Loading...',
    name: '',
    type: '',
    contact: ''
  });

  // State for the "Edit" modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);

  // --- Data Fetching ---
  const fetchAgencies = () => {
    fetch('http://localhost:5000/api/agencies/details') // Re-use public endpoint
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAgencies(data);
      })
      .catch(err => console.error("Error fetching agencies:", err));
  };

  const fetchNextId = () => {
    fetch('http://localhost:5000/api/agencies/next-id', { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => setNewAgency(prev => ({ ...prev, agency_id: data.nextId })))
      .catch(err => console.error("Error fetching next ID:", err));
  };

  useEffect(() => {
    fetchAgencies();
    fetchNextId();
  }, []); // Run once on load

  // --- "Create New" Form Handlers ---
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewAgency(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/agencies/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newAgency)
      });
      if (!res.ok) throw new Error('Failed to create agency');
      
      // Success: Clear form, refresh list, get new ID
      setNewAgency({ agency_id: 'Loading...', name: '', type: '', contact: '' });
      fetchAgencies();
      fetchNextId();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- "Edit" Modal Handlers ---
  const handleOpenEdit = (agency) => {
    setEditingAgency(agency);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingAgency(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/agencies/${editingAgency.agency_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingAgency)
      });
      if (!res.ok) throw new Error('Failed to update agency');
      
      setIsEditModalOpen(false);
      fetchAgencies(); // Refresh list
    } catch (err) {
      console.error("Error updating agency:", err);
    }
  };
  return (
    <div className="page-content">
      {/* --- 1. Create New Agency Form --- */}
      <div className="info-box" style={{ marginBottom: '2rem' }}>
        <h2>Create New Agency</h2>
        <form onSubmit={handleCreateSubmit} className="login-form" style={{ maxWidth: 'none' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Agency ID</label>
              <input type="text" name="agency_id" value={newAgency.agency_id} readOnly disabled />
            </div>
            <div className="form-group" style={{ flex: 3 }}>
              <label>Agency Name</label>
              <input type="text" name="name" value={newAgency.name} onChange={handleCreateChange} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Type (e.g., Govt, Private)</label>
              <input type="text" name="type" value={newAgency.type} onChange={handleCreateChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Contact (Phone Number)</label>
              <input type="number" name="contact" value={newAgency.contact} onChange={handleCreateChange} required />
            </div>
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-login" style={{ marginTop: '1rem', width: 'auto' }}>Create Agency</button>
        </form>
      </div>

      {/* --- 2. All Agencies Grid --- */}
      <div className="content-header">
        <h2>All Agencies</h2>
      </div>
      <div className="projects-grid">
        {agencies.map(agency => (
          <div key={agency.agency_id} className="project-card">
            <h3>{agency.name}</h3>
            <p>Type: <strong>{agency.type || 'N/A'}</strong></p>
            <p>Contact: {agency.contact || 'N/A'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => handleOpenEdit(agency)} className="btn-secondary">Edit</button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Edit Agency Modal --- */}
      {isEditModalOpen && editingAgency && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsEditModalOpen(false)}>&times;</span>
            <h2>Edit Agency: {editingAgency.name}</h2>
            <form onSubmit={handleEditSubmit} className="login-form" style={{ maxWidth: 'none' }}>
              <div className="form-group">
                <label>Agency Name</label>
                <input type="text" name="name" value={editingAgency.name} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <input type="text" name="type" value={editingAgency.type} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Contact</label>
                <input type="number" name="contact" value={editingAgency.contact} onChange={handleEditChange} required />
              </div>
              <button type="submit" className="btn-login">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAgencies;
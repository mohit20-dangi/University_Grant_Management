// src/ManageGrants.js
import React, { useState, useEffect } from 'react';
import './DashboardLayout.css'; // Use the layout and styles

// Helper to get auth token
const getToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

function ManageGrants() {
  const [grants, setGrants] = useState([]);
  const [agencies, setAgencies] = useState([]); // For dropdown
  const [error, setError] = useState('');

  // State for the "Create New" form
  const [newGrant, setNewGrant] = useState({
    grant_id: 'Loading...',
    title: '',
    amount: '',
    year: '',
    given_by: '' // This will be an agency_id
  });

  // State for the "Edit" modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState(null);

  // --- Data Fetching ---
  const fetchGrants = () => {
    // We need to join with agencies to get the agency name for the cards
    fetch('http://localhost:5000/api/agencies/details') // Re-use public endpoint
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAgencies(data);
      })
      .catch(err => console.error("Error fetching agencies:", err));

    // This is a new endpoint we should create to get grants *with* agency names
    // For now, we'll fetch them separately.
    // Let's create a "grants/details" endpoint. (We'll add this to the server)
    fetch('http://localhost:5000/api/agencies/details') // This is a placeholder
      .then(res => res.json())
      .then(data => {
        // This is not right. We need a 'grants/details' endpoint.
        // Let's go back and add it to the server...
      })
      .catch(err => console.error("Error fetching grants:", err));
  };
  
  // Let's rethink. We'll fetch grants and agencies separately and map them.
  
  const fetchAllData = async () => {
    try {
      // 1. Fetch Grants
      const grantsRes = await fetch('http://localhost:5000/api/grants/all', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const grantsData = await grantsRes.json();
      if (Array.isArray(grantsData)) setGrants(grantsData);

      // 2. Fetch Agencies (for dropdown and mapping)
      const agenciesRes = await fetch('http://localhost:5000/api/agencies/details');
      const agenciesData = await agenciesRes.json();
      if (Array.isArray(agenciesData)) setAgencies(agenciesData);

      // 3. Fetch Next ID
      const nextIdRes = await fetch('http://localhost:5000/api/grants/next-id', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const nextIdData = await nextIdRes.json();
      setNewGrant(prev => ({ ...prev, grant_id: nextIdData.nextId }));

    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []); // Run once on load

  // --- "Create New" Form Handlers ---
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewGrant(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/grants/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newGrant)
      });
      if (!res.ok) throw new Error('Failed to create grant');
      
      // Success: Clear form, refresh list, get new ID
      setNewGrant({ grant_id: 'Loading...', title: '', amount: '', year: '', given_by: '' });
      fetchAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- "Edit" Modal Handlers ---
  const handleOpenEdit = (grant) => {
    setEditingGrant(grant);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingGrant(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/grants/${editingGrant.grant_id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingGrant)
      });
      if (!res.ok) throw new Error('Failed to update grant');
      
      setIsEditModalOpen(false);
      fetchAllData(); // Refresh list
    } catch (err) {
      console.error("Error updating grant:", err);
    }
  };

  // --- "Delete" Handler ---
  const handleDelete = async (grantId) => {
    if (!window.confirm('Are you sure? This will fail if the grant is funding a project.')) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/grants/${grantId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      
      fetchAllData(); // Refresh list on success
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Helper to find agency name from ID
  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.agency_id === agencyId);
    return agency ? agency.name : 'N/A';
  };

  return (
    <div className="page-content">
      {/* --- 1. Create New Grant Form --- */}
      <div className="info-box" style={{ marginBottom: '2rem' }}>
        <h2>Create New Grant</h2>
        <form onSubmit={handleCreateSubmit} className="login-form" style={{ maxWidth: 'none' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Grant ID</label>
              <input type="text" name="grant_id" value={newGrant.grant_id} readOnly disabled />
            </div>
            <div className="form-group" style={{ flex: 3 }}>
              <label>Grant Title</label>
              <input type="text" name="title" value={newGrant.title} onChange={handleCreateChange} required />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Amount (₹)</label>
              <input type="number" name="amount" value={newGrant.amount} onChange={handleCreateChange} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Year</label>
              <input type="number" name="year" value={newGrant.year} onChange={handleCreateChange} required />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Funding Agency</label>
              <select name="given_by" value={newGrant.given_by} onChange={handleCreateChange} required>
                <option value="">-- Select Agency --</option>
                {agencies.map(a => (
                  <option key={a.agency_id} value={a.agency_id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-login" style={{ marginTop: '1rem', width: 'auto' }}>Create Grant</button>
        </form>
      </div>

      {/* --- 2. All Grants Grid --- */}
      <div className="content-header">
        <h2>All Grants</h2>
      </div>
      <div className="projects-grid">
        {grants.map(grant => (
          <div key={grant.grant_id} className="project-card">
            <h3>{grant.title}</h3>
            <p>Agency: <strong>{getAgencyName(grant.given_by)}</strong></p>
            <p>Amount: <strong>₹{Number(grant.amount).toLocaleString()}</strong></p>
            <div className="project-meta">
              <span>Year: {grant.year}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => handleOpenEdit(grant)} className="btn-secondary">Edit</button>
              <button onClick={() => handleDelete(grant.grant_id)} className="btn-secondary" style={{ borderColor: '#f5576c', color: '#f5576c' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Edit Grant Modal --- */}
      {isEditModalOpen && editingGrant && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsEditModalOpen(false)}>&times;</span>
            <h2>Edit Grant: {editingGrant.title}</h2>
            <form onSubmit={handleEditSubmit} className="login-form" style={{ maxWidth: 'none' }}>
              <div className="form-group">
                <label>Grant Title</label>
                <input type="text" name="title" value={editingGrant.title} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" name="amount" value={editingGrant.amount} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input type="number" name="year" value={editingGrant.year} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label>Funding Agency</label>
                <select name="given_by" value={editingGrant.given_by} onChange={handleEditChange} required>
                  <option value="">-- Select Agency --</option>
                  {agencies.map(a => (
                    <option key={a.agency_id} value={a.agency_id}>{a.name}</option>
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

export default ManageGrants;
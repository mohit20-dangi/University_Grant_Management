// src/LogUsage.js
import React, { useState, useEffect } from 'react';

// Helper function to create authenticated headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});
const getToken = () => localStorage.getItem('token');
const myUserId = localStorage.getItem('userId'); // We should save this on login!
// Let's fix that. We'll get it from the token for now.
const getMyUserId = () => {
    try {
        const token = getToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id; // 'id' from our JWT
    } catch (e) {
        return null;
    }
};

function LogUsage() {
  const [logs, setLogs] = useState([]);
  const [inUseLogs, setInUseLogs] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [error, setError] = useState('');
  
  // New Form State
  const [equipSearch, setEquipSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [selectedProj, setSelectedProj] = useState('');

  // Fetch all logs on load
  const fetchLogs = () => {
    fetch('http://localhost:5000/api/usage/my-logs', { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const currentUserId = getMyUserId();
        // Filter logs
        const inUse = data.filter(log => log.researcher_id === currentUserId && log.end_timestamp === null);
        const history = data.filter(log => log.end_timestamp !== null);
        setInUseLogs(inUse);
        setHistoryLogs(history);
      })
      .catch(err => console.error("Error fetching logs:", err));
  };
  
  // Fetch dropdown data
  const fetchDropdownData = () => {
     fetch('http://localhost:5000/api/projects/my-projects', { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMyProjects(data);
      })
      .catch(err => console.error("Error fetching my projects:", err));
  };

  useEffect(() => {
    fetchLogs();
    fetchDropdownData();
  }, []); // Run once on load

  // --- Event Handlers ---

  const handleReturn = async (log) => {
    try {
      const res = await fetch('http://localhost:5000/api/usage/return', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          equipment_id: log.equipment_id,
          project_id: log.project_id,
          researcher_id: log.researcher_id
        })
      });
      if (!res.ok) throw new Error('Failed to return');
      fetchLogs(); // Refresh the lists
    } catch (err) {
      console.error("Error returning:", err);
    }
  };

  const handleSearchChange = async (text) => {
    setEquipSearch(text);
    setSelectedEquip(null);
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/equipment/search?q=${text}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error searching equipment:", err);
    }
  };

  const handleSuggestionClick = (equip) => {
    setSelectedEquip(equip);
    setEquipSearch(equip.equipment_name);
    setSuggestions([]);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedEquip || !selectedProj) {
      setError('Please select equipment and a project.');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/usage/create-checkout', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          equipment_id: selectedEquip.equipment_id,
          project_id: selectedProj
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check out');
      
      // Success
      fetchLogs(); // Refresh lists
      setShowForm(false);
      setSelectedEquip(null);
      setSelectedProj('');
      setEquipSearch('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-content">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My Equipment Usage</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Log'}
        </button>
      </div>

      {/* --- New Log Form (Hidden by default) --- */}
      {showForm && (
        <div className="info-box" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleCheckoutSubmit} className="login-form" style={{ maxWidth: 'none' }}>
            <div className="form-group">
              <label>Equipment</label>
              <div className="author-input-group">
                <input
                  type="text"
                  placeholder="Start typing equipment name (min 3 chars)..."
                  value={equipSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  required
                />
                {suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map(sug => (
                      <li key={sug.equipment_id} onClick={() => handleSuggestionClick(sug)}>
                        <strong>{sug.equipment_name}</strong> (Model: {sug.model || 'N/A'})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>For Project</label>
              <select value={selectedProj} onChange={e => setSelectedProj(e.target.value)} required>
                <option value="">-- Select Your Project --</option>
                {myProjects.map(proj => (
                  <option key={proj.project_id} value={proj.project_id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>
            
            <p><strong>Researcher:</strong> You (Logged in)</p>
            <p><strong>Start Time:</strong> Now (Automatic)</p>

            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-login" style={{ marginTop: '1rem' }}>Check Out</button>
          </form>
        </div>
      )}

      {/* --- In-Use Items --- */}
      <div className="content-header" style={{ marginTop: '2rem' }}>
        <h3>Currently In Use (By Me)</h3>
      </div>
      <div className="projects-grid">
        {inUseLogs.length > 0 ? (
          inUseLogs.map(log => (
            <div key={`${log.equipment_id}-${log.project_id}`} className="project-card">
              <h3>{log.equipment_name}</h3>
              <p>For Project: <strong>{log.project_title}</strong></p>
              <p>Started: {new Date(log.start_timestamp).toLocaleString()}</p>
              <button onClick={() => handleReturn(log)} className="btn-secondary" style={{ width: '100%', background: '#43e97b', color: '#111' }}>
                Return Equipment
              </button>
            </div>
          ))
        ) : (
          <p>You have no equipment currently in use.</p>
        )}
      </div>

      {/* --- Usage History --- */}
      <div className="content-header" style={{ marginTop: '2rem' }}>
        <h3>My Usage History</h3>
      </div>
      <div className="info-box">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Equipment</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Project</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>User</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Start</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>End</th>
            </tr>
          </thead>
          <tbody>
            {historyLogs.length > 0 ? (
              historyLogs.map(log => (
                <tr key={`${log.equipment_id}-${log.project_id}-${log.start_timestamp}`}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.equipment_name}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.project_title}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.researcher_name}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(log.start_timestamp).toLocaleString()}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(log.end_timestamp).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No usage history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogUsage;
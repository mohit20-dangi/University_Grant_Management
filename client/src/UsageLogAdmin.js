// src/UsageLogAdmin.js
import React, { useState, useEffect } from 'react';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// --- Main Component ---
function UsageLogAdmin() {
  const [logs, setLogs] = useState([]);
  
  // State for filters
  const [showAll, setShowAll] = useState(false);
  const [researcherFilter, setResearcherFilter] = useState({ text: '', id: null, suggestions: [] });
  const [projectFilter, setProjectFilter] = useState({ text: '', id: null, suggestions: [] });
  const [equipmentFilter, setEquipmentFilter] = useState({ text: '', id: null, suggestions: [] });

  // --- Data Fetching ---
  useEffect(() => {
    // Build query params
    const params = new URLSearchParams();
    params.append('showAll', showAll);
    if (researcherFilter.id) params.append('researcherId', researcherFilter.id);
    if (projectFilter.id) params.append('projectId', projectFilter.id);
    if (equipmentFilter.id) params.append('equipmentId', equipmentFilter.id);
    
    // Fetch logs when filters change
    fetch(`http://localhost:5000/api/usage/all-logs?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setLogs(data);
      else setLogs([]);
    })
    .catch(err => console.error("Error fetching all logs:", err));
  }, [showAll, researcherFilter.id, projectFilter.id, equipmentFilter.id]); // Re-fetch on filter change

  // --- Autocomplete Handlers ---
  const handleSearch = (text, type) => {
    let endpoint = '';
    let setState;

    if (type === 'researcher') {
      setResearcherFilter({ ...researcherFilter, text, id: null });
      endpoint = `/api/researchers/search?q=${text}`;
      setState = setResearcherFilter;
    } else if (type === 'project') {
      setProjectFilter({ ...projectFilter, text, id: null });
      endpoint = `/api/projects/search?q=${text}`;
      setState = setProjectFilter;
    } else if (type === 'equipment') {
      setEquipmentFilter({ ...equipmentFilter, text, id: null });
      endpoint = `/api/equipment/search?q=${text}`;
      setState = setEquipmentFilter;
    }

    if (text.length < 3) {
      setState(prev => ({ ...prev, suggestions: [] }));
      return;
    }

    fetch(`http://localhost:5000${endpoint}`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setState(prev => ({ ...prev, suggestions: data }));
        }
      });
  };

  const onSuggestionClick = (item, type) => {
    if (type === 'researcher') {
      setResearcherFilter({ text: item.name, id: item.researcher_id, suggestions: [] });
    } else if (type === 'project') {
      setProjectFilter({ text: item.title, id: item.project_id, suggestions: [] });
    } else if (type === 'equipment') {
      setEquipmentFilter({ text: item.equipment_name, id: item.equipment_id, suggestions: [] });
    }
  };

  return (
    <div className="page-content">
      {/* --- Filter Bar --- */}
      <div className="filter-bar">
        <div className="filter-group-check">
          <input 
            type="checkbox" 
            id="show-all-filter" 
            checked={showAll} 
            onChange={e => setShowAll(e.target.checked)} 
          />
          <label htmlFor="show-all-filter">Show All Departments</label>
        </div>
        
        {/* Researcher Filter */}
        <div className="filter-group" style={{ position: 'relative' }}>
          <label>Filter by Researcher</label>
          <input
            type="text"
            placeholder="Min 3 chars..."
            value={researcherFilter.text}
            onChange={e => handleSearch(e.target.value, 'researcher')}
          />
          {researcherFilter.suggestions.length > 0 && (
            <ul className="suggestions-list">
              {researcherFilter.suggestions.map(s => (
                <li key={s.researcher_id} onClick={() => onSuggestionClick(s, 'researcher')}>
                  {s.name} ({s.email})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Project Filter */}
        <div className="filter-group" style={{ position: 'relative' }}>
          <label>Filter by Project</label>
          <input
            type="text"
            placeholder="Min 3 chars..."
            value={projectFilter.text}
            onChange={e => handleSearch(e.target.value, 'project')}
          />
          {projectFilter.suggestions.length > 0 && (
            <ul className="suggestions-list">
              {projectFilter.suggestions.map(s => (
                <li key={s.project_id} onClick={() => onSuggestionClick(s, 'project')}>
                  {s.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Equipment Filter */}
        <div className="filter-group" style={{ position: 'relative' }}>
          <label>Filter by Equipment</label>
          <input
            type="text"
            placeholder="Min 3 chars..."
            value={equipmentFilter.text}
            onChange={e => handleSearch(e.target.value, 'equipment')}
          />
          {equipmentFilter.suggestions.length > 0 && (
            <ul className="suggestions-list">
              {equipmentFilter.suggestions.map(s => (
                <li key={s.equipment_id} onClick={() => onSuggestionClick(s, 'equipment')}>
                  {s.equipment_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* --- Results Table --- */}
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
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={`${log.equipment_id}-${log.project_id}-${index}`}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.equipment_name}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.project_title}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.researcher_name}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(log.start_timestamp).toLocaleString()}</td>
                  <td style={{ padding: '8px', borderBottom: '1s solid #eee' }}>
                    {log.end_timestamp ? new Date(log.end_timestamp).toLocaleString() : <span style={{color: 'green', fontWeight: 'bold'}}>IN USE</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsageLogAdmin;
// src/ManageProjects.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardLayout.css'; // Use the layout and styles

// Helper to get auth token
const getToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

function ManageProjects() {
  const navigate = useNavigate();

  // Mode: 'create' or 'update'
  const [mode, setMode] = useState('create');
  
  // Form state
  const [projectId, setProjectId] = useState('Loading...');
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- Project Leader ---
  const [leader, setLeader] = useState(null); // { id, name }
  const [leaderInput, setLeaderInput] = useState('');
  const [leaderSuggestions, setLeaderSuggestions] = useState([]);

  // --- Dynamic Members ---
  const [members, setMembers] = useState([]); // { id, name }
  const [memberInputs, setMemberInputs] = useState(['']); // "Jane D..."
  const [memberRoles, setMemberRoles] = useState(['']); // "Co-Investigator"
  const [memberSuggestions, setMemberSuggestions] = useState([]);

  // --- Dynamic Grants ---
  const [grants, setGrants] = useState([]); // { id, title }
  const [grantInputs, setGrantInputs] = useState(['']); // "NSF Grant..."
  const [grantAmounts, setGrantAmounts] = useState([0]);
  const [grantSuggestions, setGrantSuggestions] = useState([]);
  
  // --- Search State ---
  const [projectSearch, setProjectSearch] = useState('');
  const [projectSuggestions, setProjectSuggestions] = useState([]);

  // --- Helper: Get Next Project ID ---
  const fetchNextId = () => {
    fetch('http://localhost:5000/api/projects/next-id', { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => setProjectId(data.nextId))
      .catch(err => console.error("Error fetching next ID:", err));
  };

  // --- Helper: Reset Form to 'Create' mode ---
  const resetToCreateMode = () => {
    setMode('create');
    setTitle('');
    setAbstract('');
    setStartDate('');
    setEndDate('');
    setLeader(null);
    setLeaderInput('');
    setMembers([]);
    setMemberInputs(['']);
    setMemberRoles(['']);
    setGrants([]);
    setGrantInputs(['']);
    setGrantAmounts([0]);
    fetchNextId();
  };

  // Initial load: set to Create mode
  useEffect(() => {
    resetToCreateMode();
  }, []);

  // --- Autocomplete Handlers ---
  const handleSearch = async (text, type, index) => {
    let endpoint = '';
    let setSuggestionsFunc;
    
    if (type === 'leader') {
      setLeaderInput(text);
      setLeader(null); // Clear selected leader if text changes
      endpoint = `/api/researchers/search?q=${text}`;
      setSuggestionsFunc = setLeaderSuggestions;
    } else if (type === 'member') {
      const newInputs = [...memberInputs];
      newInputs[index] = text;
      setMemberInputs(newInputs);
      endpoint = `/api/researchers/search?q=${text}`;
      setSuggestionsFunc = setMemberSuggestions;
    } else if (type === 'grant') {
      const newInputs = [...grantInputs];
      newInputs[index] = text;
      setGrantInputs(newInputs);
      endpoint = `/api/grants/search?q=${text}`;
      setSuggestionsFunc = setGrantSuggestions;
    } else if (type === 'project') {
      setProjectSearch(text);
      endpoint = `/api/projects/search?q=${text}`;
      setSuggestionsFunc = setProjectSuggestions;
    }

    if (text.length < 3) {
      setSuggestionsFunc([]);
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const data = await res.json();
      setSuggestionsFunc(data);
    } catch (err) {
      console.error(`Error searching ${type}:`, err);
    }
  };

  const onSuggestionClick = (item, type, index) => {
    if (type === 'leader') {
      setLeader({ id: item.researcher_id, name: item.name });
      setLeaderInput(item.name);
      setLeaderSuggestions([]);
    } else if (type === 'member') {
      const newMembers = [...members];
      newMembers[index] = { id: item.researcher_id, name: item.name };
      setMembers(newMembers);
      
      const newInputs = [...memberInputs];
      newInputs[index] = item.name;
      setMemberInputs(newInputs);
      setMemberSuggestions([]);
    } else if (type === 'grant') {
      const newGrants = [...grants];
      newGrants[index] = { id: item.grant_id, title: item.title };
      setGrants(newGrants);
      
      const newInputs = [...grantInputs];
      newInputs[index] = item.title;
      setGrantInputs(newInputs);
      setGrantSuggestions([]);
    }
  };

  // --- Load Project for Update ---
  const loadProjectForEdit = async (project) => {
    setProjectSearch(project.title);
    setProjectSuggestions([]);
    setMode('update');
    
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${project.project_id}/manage-details`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const data = await res.json();
      
      // Get leader details (needed for the form)
      const leaderRes = await fetch(`http://localhost:5000/api/researchers/detailed?researcherId=${data.project.leader_id}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const leaderData = await leaderRes.json();
      
      // Set all states
      setProjectId(data.project.project_id);
      setTitle(data.project.title);
      setAbstract(data.project.abstract);
      setStartDate(data.project.start_date ? new Date(data.project.start_date).toISOString().split('T')[0] : '');
      setEndDate(data.project.end_date ? new Date(data.project.end_date).toISOString().split('T')[0] : '');
      
      if (leaderData.length > 0) {
        setLeader({ id: leaderData[0].researcher_id, name: leaderData[0].name });
        setLeaderInput(leaderData[0].name);
      }
      
      setMembers(data.members.map(m => ({ id: m.researcher_id, name: m.name })));
      setMemberInputs(data.members.map(m => m.name));
      setMemberRoles(data.members.map(m => m.role));
      
      setGrants(data.grants.map(g => ({ id: g.grant_id, title: g.title })));
      setGrantInputs(data.grants.map(g => g.title));
      setGrantAmounts(data.grants.map(g => g.amount));
      
    } catch (err) {
      console.error("Error loading project data:", err);
      alert("Error loading project data. See console.");
      resetToCreateMode();
    }
  };

  // --- Dynamic Field Adders ---
  const addMemberField = () => {
    setMemberInputs([...memberInputs, '']);
    setMemberRoles([...memberRoles, '']);
  };

  const addGrantField = () => {
    setGrantInputs([...grantInputs, '']);
    setGrantAmounts([...grantAmounts, 0]);
  };

  // --- Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!leader) {
      alert('You must select a Project Leader.');
      return;
    }

    const finalMembers = members
      .map((member, index) => ({ id: member.id, role: memberRoles[index] }))
      .filter(m => m.id && m.role); // Ensure they are valid

    const finalGrants = grants
      .map((grant, index) => ({ id: grant.id, amount: grantAmounts[index] }))
      .filter(g => g.id && g.amount > 0);

    const projectData = {
      project_id: projectId,
      title, abstract,
      start_date: startDate,
      end_date: endDate.length ? endDate : null, // Handle empty date
      leader_id: leader.id,
      members: finalMembers,
      grants: finalGrants
    };

    const endpoint = (mode === 'create')
      ? 'http://localhost:5000/api/projects/create'
      : `http://localhost:5000/api/projects/${projectId}/update`;
    
    const method = (mode === 'create') ? 'POST' : 'PUT';

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData)
      });
      if (!res.ok) throw new Error(`Failed to ${mode} project`);
      
      alert(`Project ${mode}d successfully!`);
      resetToCreateMode(); // Go back to create mode
      
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page-content">
      {/* --- 1. Search / Mode Toggle --- */}
      <div className="info-box" style={{ marginBottom: '2rem' }}>
        <h2>Manage Projects</h2>
        <p>Search for a project to update, or fill out the form to create a new one.</p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="filter-group" style={{ flex: 1, position: 'relative' }}>
            <label>Search Project by Name</label>
            <input
              type="text"
              placeholder="Start typing a project title (min 3 chars)..."
              value={projectSearch}
              onChange={e => handleSearch(e.target.value, 'project')}
            />
            {projectSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {projectSuggestions.map(sug => (
                  <li key={sug.project_id} onClick={() => loadProjectForEdit(sug)}>
                    <strong>{sug.title}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" onClick={resetToCreateMode} className="btn-secondary" style={{ marginTop: '1rem' }}>
            + Create New
          </button>
        </div>
      </div>

      {/* --- 2. Main Project Form --- */}
      <div className="info-box">
        <h2>{mode === 'create' ? 'Create New Project' : `Updating: ${title}`}</h2>
        
        <form onSubmit={handleSubmit} className="login-form" style={{ maxWidth: 'none' }}>
          
          <div className="form-group">
            <label>Project ID</label>
            <input type="text" value={projectId} readOnly disabled />
          </div>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Abstract</label>
            <textarea value={abstract} onChange={e => setAbstract(e.target.value)} rows="4"></textarea>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          
          <hr style={{ margin: '2rem 0' }} />

          {/* --- Project Leader --- */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Project Leader</label>
            <input
              type="text"
              placeholder="Start typing a name (min 3 chars)..."
              value={leaderInput}
              onChange={e => handleSearch(e.target.value, 'leader')}
              required
            />
            {leaderSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {leaderSuggestions.map(sug => (
                  <li key={sug.researcher_id} onClick={() => onSuggestionClick(sug, 'leader')}>
                    <strong>{sug.name}</strong> ({sug.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <hr style={{ margin: '2rem 0' }} />

          {/* --- Dynamic Members --- */}
          <div className="form-group">
            <label>Other Team Members</label>
            {memberInputs.map((inputName, index) => (
              <div key={index} className="author-input-group" style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="author-input"
                  style={{ flex: 2 }}
                  placeholder="Start typing a name (min 3 chars)..."
                  value={inputName}
                  onChange={e => handleSearch(e.target.value, 'member', index)}
                />
                <input
                  type="text"
                  placeholder="Role (e.g., Co-Investigator)"
                  style={{ flex: 1 }}
                  value={memberRoles[index]}
                  onChange={e => {
                    const newRoles = [...memberRoles];
                    newRoles[index] = e.target.value;
                    setMemberRoles(newRoles);
                  }}
                />
                {memberSuggestions.length > 0 && (
                  <ul className="suggestions-list" style={{ width: 'calc(66% - 1rem)' }}>
                    {memberSuggestions.map(sug => (
                      <li key={sug.researcher_id} onClick={() => onSuggestionClick(sug, 'member', index)}>
                        <strong>{sug.name}</strong> ({sug.email})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <button type="button" onClick={addMemberField} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              + Add Member
            </button>
          </div>
          
          <hr style={{ margin: '2rem 0' }} />

          {/* --- Dynamic Grants --- */}
          <div className="form-group">
            <label>Funding Grants</label>
            {grantInputs.map((inputName, index) => (
              <div key={index} className="author-input-group" style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="author-input"
                  style={{ flex: 2 }}
                  placeholder="Start typing a grant title (min 3 chars)..."
                  value={inputName}
                  onChange={e => handleSearch(e.target.value, 'grant', index)}
                />
                <input
                  type="number"
                  placeholder="Amount (e.g., 50000)"
                  style={{ flex: 1 }}
                  value={grantAmounts[index]}
                  onChange={e => {
                    const newAmounts = [...grantAmounts];
                    newAmounts[index] = e.target.value;
                    setGrantAmounts(newAmounts);
                  }}
                />
                {grantSuggestions.length > 0 && (
                  <ul className="suggestions-list" style={{ width: 'calc(66% - 1rem)' }}>
                    {grantSuggestions.map(sug => (
                      <li key={sug.grant_id} onClick={() => onSuggestionClick(sug, 'grant', index)}>
                        <strong>{sug.title}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <button type="button" onClick={addGrantField} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              + Add Grant
            </button>
          </div>
          
          <button type="submit" className="btn-login" style={{ marginTop: '2rem' }}>
            {mode === 'create' ? 'Create Project' : 'Update Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ManageProjects;
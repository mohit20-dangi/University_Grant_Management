// src/CreatePublication.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

function CreatePublication() {
  const navigate = useNavigate();
  
  // Form state
  const [publicationId, setPublicationId] = useState('Loading...');
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('');
  const [date, setDate] = useState('');
  const [doi, setDoi] = useState('');
  
  // Dynamic Projects state
  const [myProjects, setMyProjects] = useState([]); // All projects researcher is in
  const [selectedProjects, setSelectedProjects] = useState(['']); // Array of selected project_ids
  
  // Dynamic Authors state
  const [authors, setAuthors] = useState([]); // Array of { id: 'R002', name: 'John Doe' }
  const [authorInputs, setAuthorInputs] = useState(['']); // Array of "Jane D..."
  const [suggestions, setSuggestions] = useState([]); // Array of [ { id, name }, { id, name } ]

  // 1. Fetch Next ID and My Projects on load
  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${getToken()}` };

    // Fetch Next ID
    fetch('http://localhost:5000/api/publications/next-id', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch next ID');
        return res.json();
      })
      .then(data => setPublicationId(data.nextId))
      .catch(err => {
        console.error(err);
        setPublicationId('Error!'); // Show error in the field
      });

    // Fetch My Projects (for dropdown)
    fetch('http://localhost:5000/api/projects/my-projects', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setMyProjects(data);
        } else {
          setMyProjects([]); // Set to empty array on failure
        }
      })
      .catch(err => {
        console.error("Error fetching my projects:", err);
        setMyProjects([]); // Set to empty array on error
      });
  }, []);

  // 2. Handle Author Autocomplete
  const handleAuthorSearch = async (text, index) => {
    // Update the input field text
    const newAuthorInputs = [...authorInputs];
    newAuthorInputs[index] = text;
    setAuthorInputs(newAuthorInputs);

    // Clear suggestions and ID if text is short
    if (text.length < 4) {
      setSuggestions([]);
      const newAuthors = [...authors];
      newAuthors[index] = undefined; // Clear the selected author
      setAuthors(newAuthors);
      return;
    }

    // Fetch suggestions
    try {
      const res = await fetch(`http://localhost:5000/api/researchers/search?q=${text}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error searching authors:", err);
    }
  };

  const handleSuggestionClick = (researcher, index) => {
    // Set the selected author's ID and name
    const newAuthors = [...authors];
    newAuthors[index] = { id: researcher.researcher_id, name: researcher.name };
    setAuthors(newAuthors);
    
    // Update the input field text
    const newAuthorInputs = [...authorInputs];
    newAuthorInputs[index] = researcher.name;
    setAuthorInputs(newAuthorInputs);

    // Clear suggestions
    setSuggestions([]);
  };

  const handleAddAuthor = () => {
    setAuthorInputs([...authorInputs, '']);
  };

  // 3. Handle Project Selection
  const handleAddProject = () => {
    setSelectedProjects([...selectedProjects, '']);
  };

  const handleProjectChange = (projectId, index) => {
    const newSelectedProjects = [...selectedProjects];
    newSelectedProjects[index] = projectId;
    setSelectedProjects(newSelectedProjects);
  };

  // 4. Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalData = {
      publication_id: publicationId,
      title,
      journal,
      publication_date: date,
      doi,
      project_ids: selectedProjects.filter(id => id !== ''), // Filter out empty selections
      authors: authors.filter(auth => auth).map((auth, index) => ({ // Filter out empty, add order
        id: auth.id,
        order: index
      }))
    };

    try {
      const res = await fetch('http://localhost:5000/api/publications/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(finalData)
      });

      if (!res.ok) {
        throw new Error('Failed to create publication');
      }

      alert('Publication created successfully!');
      navigate('/dashboard'); // Go back to dashboard on success

    } catch (err) {
      console.error("Error creating publication:", err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="page-content">
      <div className="content-header">
        <h2>Create New Publication</h2>
      </div>
      <div className="info-box">
        <form onSubmit={handleSubmit} className="login-form" style={{ maxWidth: 'none' }}>
          
          <div className="form-group">
            <label>Publication ID</label>
            <input type="text" value={publicationId} readOnly disabled />
          </div>

          <div className="form-group">
            <label>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Journal</label>
            <input type="text" value={journal} onChange={e => setJournal(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>DOI</label>
            <input type="text" value={doi} onChange={e => setDoi(e.target.value)} />
          </div>

          <hr style={{ margin: '2rem 0' }} />

          {/* --- Dynamic Projects --- */}
          <div className="form-group">
            <label>Related Projects (from your "My Projects" list)</label>
            {selectedProjects.map((projectId, index) => (
              <select 
                key={index} 
                value={projectId} 
                onChange={e => handleProjectChange(e.target.value, index)}
                style={{ marginBottom: '10px' }}
              >
                <option value="">-- Select a Project --</option>
                {myProjects.map(proj => (
                  <option key={proj.project_id} value={proj.project_id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            ))}
            <button type="button" onClick={handleAddProject} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              + Add Another Project
            </button>
          </div>

          <hr style={{ margin: '2rem 0' }} />

          {/* --- Dynamic Authors --- */}
          <div className="form-group">
            <label>Authors (you are added automatically as first author)</label>
            {authorInputs.map((inputName, index) => (
              <div key={index} className="author-input-group" style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="author-input"
                  placeholder="Start typing a name (min 4 chars)..."
                  value={inputName}
                  onChange={e => handleAuthorSearch(e.target.value, index)}
                />
                {/* --- Autocomplete Box --- */}
                {suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map(sug => (
                      <li key={sug.researcher_id} onClick={() => handleSuggestionClick(sug, index)}>
                        <strong>{sug.name}</strong> ({sug.email})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddAuthor} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              + Add Another Author
            </button>
          </div>
          
          <button type="submit" className="btn-login" style={{ marginTop: '2rem' }}>Create Publication</button>
        </form>
      </div>
    </div>
  );
}

export default CreatePublication;
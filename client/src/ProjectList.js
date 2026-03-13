// src/ProjectList.js

import React, { useState, useEffect } from 'react';

function ProjectList() {
  const [projects, setProjects] = useState([]); // State to store the list of projects

  useEffect(() => {
    // Fetch data from the back-end API
    fetch('http://localhost:5000/api/projects')
      .then(response => response.json())
      .then(data => setProjects(data))
      .catch(error => console.error('Error fetching projects:', error));
  }, []); // The empty array ensures this effect runs only once

  return (
    <div>
      <h1>Research Projects</h1>
      <ul>
        {projects.map(project => (
          <li key={project.project_id}>
            <strong>{project.title}</strong> - Starts: {project.start_date}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectList;
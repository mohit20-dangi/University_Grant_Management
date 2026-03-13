// src/LoginPage.js
import React, { useState } from 'react';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [researcherId, setResearcherId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          researcher_id_password: researcherId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // --- LOGIN SUCCESSFUL ---
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userRole', data.role);
      
      // Redirect to the dashboard
      window.location.href = '/dashboard';

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <div className="login-logo">
              <span className="logo-icon" role="img" aria-label="chart">📊</span>
              <h1>ResearchHub</h1>
            </div>
            <p>University Research & Grant Management</p>
          </div>
          
          <form id="loginForm" className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.reed@university.edu"
              />
            </div>
            <div className="form-group">
              <label htmlFor="researcherId">Password</label>
              <input
                type="text" // Changed from 'password' to 'text' for researcher ID
                id="researcherId"
                value={researcherId}
                onChange={(e) => setResearcherId(e.target.value)}
                required
                placeholder="R001"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-login">Sign In</button>
          </form>
        </div>
      </div>
      <div className="login-image">
        <div className="login-content">
          <h2>Welcome Back</h2>
          <p>Manage your research, collaborate with teams, and track progress all in one place.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import our page components
import HomePage from './HomePage';     // Our new public homepage
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import ExploreProjects from './ExploreProjects';
import ExploreDepartments from './ExploreDepartments';
import ExplorePublications from './ExplorePublications';
import ExploreAgencies from './ExploreAgencies';
import ExploreEquipment from './ExploreEquipment';
import DashboardHome from './DashboardHome';
import ViewResearchers from './ViewResearchers';
import LogUsage from './LogUsage';
import CreatePublication from './CreatePublication';
import ViewEquipment from './ViewEquipment';
import UsageLogAdmin from './UsageLogAdmin';
import ManageAgencies from './ManageAgencies';
import ManageResearchers from './ManageResearchers';
import ManageProjects from './ManageProjects';
import ManageGrants from './ManageGrants';

// This is a helper component to protect our dashboard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/login" replace />;
  }
  return children; // If token exists, show the protected component
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/projects" element={<ExploreProjects />} />
          <Route path="/departments" element={<ExploreDepartments />} />
          <Route path="/publications" element={<ExplorePublications />} />
          <Route path="/agencies" element={<ExploreAgencies />} />
          <Route path="/equipment" element={<ExploreEquipment />} />

          {/* --- Protected Routes (Nested) --- */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            {/* This 'index' route renders DashboardHome at /dashboard */}
            <Route index element={<DashboardHome />} /> 

            {/* These are the child pages */}
            <Route path="researchers" element={<ViewResearchers />} />
            <Route path="usage/new" element={<LogUsage />} />
            <Route path="publications/new" element={<CreatePublication />} />
            <Route path="equipment" element={<ViewEquipment />} />
            <Route path="usage-log" element={<UsageLogAdmin />} />
            <Route path="agencies/manage" element={<ManageAgencies />} />
            <Route path="researchers/manage" element={<ManageResearchers />} />
            <Route path="projects/manage" element={<ManageProjects />} />
            <Route path="grants/manage" element={<ManageGrants />} />

          </Route>

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
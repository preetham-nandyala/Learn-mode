import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ModulesPage from './pages/ModulesPage';
import ModulePage from './pages/ModulePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/module/:id" element={<ModulePage />} />
      </Routes>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ModulesPage from './pages/ModulesPage';
import ModuleView from './pages/ModuleView';
import PracticePage from './pages/PracticePage';
import TestPage from './pages/TestPage';
import HistoryDetailPage from './pages/HistoryDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/module/:id" element={<ModuleView />} />
        <Route path="/module/:id/practice/:level" element={<PracticePage />} />
        <Route path="/module/:id/test/:level" element={<TestPage />} />
        <Route path="/history/:historyId" element={<HistoryDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;

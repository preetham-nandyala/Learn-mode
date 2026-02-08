import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ModulesPage from './pages/ModulesPage';
import ModuleView from './pages/ModuleView';
import PracticePage from './pages/PracticePage';
import TestPage from './pages/TestPage';
import FinalTestPage from './pages/FinalTestPage';
import ChallengesPage from './pages/ChallengesPage';
import ChallengeView from './pages/ChallengeView';
import HistoryDetailPage from './pages/HistoryDetailPage';
import InterviewPage from './pages/InterviewPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with MainLayout (Navbar + Footer) */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/history/:historyId" element={<HistoryDetailPage />} />
        </Route>

        {/* Detail Views (No Site-wide Navbar, handles own navigation) */}
        <Route path="/module/:id" element={<ModuleView />} />
        <Route path="/challenges/:id" element={<ChallengeView />} />

        {/* Fullscreen/Secure Routes (No Site-wide Navbar/Footer) */}
        <Route path="/module/:id/learning/:level" element={<InterviewPage />} />
        <Route path="/module/:id/interview/:level" element={<InterviewPage />} />
        <Route path="/module/:id/practice/:level" element={<PracticePage />} />
        <Route path="/module/:id/test/:level" element={<TestPage />} />
        <Route path="/challenges/:id/test/:level" element={<TestPage />} />
        <Route path="/challenges/:id/final-test" element={<FinalTestPage />} />
        <Route path="/challenges/:id/secure-test" element={<FinalTestPage secureMode={true} />} />
      </Routes>
    </Router>
  );
}

export default App;

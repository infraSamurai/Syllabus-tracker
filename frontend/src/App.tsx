import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from './components/common/Navbar';
import ProgressPage from './pages/Progress';
import TeacherPage from './pages/Teacher';
import AdminPage from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/progress" replace />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/teacher" element={<TeacherPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

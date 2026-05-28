import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TestEntry from './pages/TestEntry';
import Demographics from './pages/Demographics';
import Guidelines from './pages/Guidelines';
import TestInterface from './pages/TestInterface';
import TestResult from './pages/TestResult';
import HexaUserLogin from './pages/HexaUserLogin';
import HexaUserSetup from './pages/HexaUserSetup';
import HexaUserDashboard from './pages/HexaUserDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/test" element={<TestEntry />} />
          <Route path="/demographics" element={<Demographics />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/test-interface" element={<TestInterface />} />
          <Route path="/result" element={<TestResult />} />
          <Route path="/hexauser/login" element={<HexaUserLogin />} />
          <Route path="/hexauser/setup" element={<HexaUserSetup />} />
          <Route path="/hexauser/dashboard" element={<HexaUserDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

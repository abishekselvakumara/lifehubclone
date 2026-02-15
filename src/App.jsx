import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home';
import Task from './pages/Task';
import Finance from './pages/Finance';
import Study from './pages/Study';
import { AuthProvider } from './context/AuthContext';
import React from 'react'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/task" element={<Task />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/study" element={<Study />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
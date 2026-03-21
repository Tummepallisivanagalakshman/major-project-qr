import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
          <Route 
            path="/" 
            element={
              user ? (
                user.role === 'admin' ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> : 
                <StudentDashboard user={user} onLogout={() => setUser(null)} onUpdateUser={setUser} />
              ) : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { getMe, logoutUser } from './lib/api';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getMe();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Auth check failed');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 transition-colors duration-300">
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'glass-card border border-white/20 dark:border-white/5 dark:text-white rounded-2xl font-bold text-sm shadow-2xl',
              duration: 4000,
            }} 
          />
          <Routes>
            <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
              <Route 
                path="/" 
                element={
                  user ? (
                    user.role === 'admin' ? 
                    <AdminDashboard user={user} onLogout={handleLogout} /> : 
                    <StudentDashboard user={user} onLogout={handleLogout} onUpdateUser={setUser} />
                  ) : <LandingPage />
                } 
              />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;

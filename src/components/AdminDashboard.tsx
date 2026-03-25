import React, { useState, useEffect, useCallback } from 'react';
import { 
  LogOut, Users, ClipboardList, Settings as SettingsIcon, 
  Camera, CreditCard, CheckCircle, XCircle, 
  AlertCircle, LayoutDashboard, Home, Utensils,
  BarChart3, Bell, ShieldCheck, Menu, X, Building2, Sun, Moon,
  QrCode, Zap, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import MenuLogs from './MenuLogs';

// Sub-components
import Overview from './admin/Overview';
import StudentManagement from './admin/StudentManagement';
import RoomManagement from './admin/RoomManagement';
import PaymentManagement from './admin/PaymentManagement';
import MealLogs from './admin/MealLogs';
import Reports from './admin/Reports';
import Notifications from './admin/Notifications';
import Rules from './admin/Rules';
import Settings from './admin/Settings';
import QRScanner from './QRScanner';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'students' | 'rooms' | 'payments' | 'logs' | 'reports' | 'notifications' | 'rules' | 'settings' | 'scanner' | 'menu';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<any>({});
  const [students, setStudents] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [latestPayment, setLatestPayment] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/students')
      ]);
      const statsData = await statsRes.json();
      const studentsData = await studentsRes.json();
      
      setStats(statsData.success ? statsData.stats : (statsData || {}));
      setStudents(Array.isArray(studentsData) ? studentsData : (studentsData.success ? studentsData.students : []));
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const socket = io();
    socket.on('student_registered', (data) => {
      toast.success(`New student registered: ${data.full_name}`, {
        icon: '👤',
        style: {
          borderRadius: '1rem',
          background: '#1e293b',
          color: '#fff',
        },
      });
      fetchData();
    });

    socket.on('payment_received', (data) => {
      setLatestPayment(data);
      playSound('success');
      toast.success(`Payment of ₹${data.amount} received from ${data.full_name || data.student_id}`, {
        icon: '💰',
        style: {
          borderRadius: '1rem',
          background: '#1e293b',
          color: '#fff',
        },
      });
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  const playSound = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const handleScanSuccess = async (scannedData: string) => {
    try {
      const response = await fetch('/api/meal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: scannedData }),
      });
      const data = await response.json();
      if (data.success) {
        playSound('success');
        toast.success(`Approved: ${data.meal}`, {
          icon: '✅',
          style: {
            borderRadius: '1rem',
            background: '#1e293b',
            color: '#fff',
          },
        });
        fetchData();
      } else {
        playSound('error');
        if (data.message.includes('Already accessed') || data.message.includes('Duplicate')) {
          toast.error('Duplicate QR', {
            icon: '⚠️',
            style: { borderRadius: '1rem', background: '#1e293b', color: '#fff' },
          });
        } else if (data.message.includes('Pending fees') || data.message.includes('Error')) {
          toast.error(`Error: ${data.message}`, {
            icon: '❌',
            style: { borderRadius: '1rem', background: '#1e293b', color: '#fff' },
          });
        } else {
          toast.error(data.message, {
            icon: '❌',
            style: { borderRadius: '1rem', background: '#1e293b', color: '#fff' },
          });
        }
      }
    } catch (err) {
      playSound('error');
      toast.error('Scanner error. Please try again.', {
        icon: '❌',
        style: {
          borderRadius: '1rem',
          background: '#1e293b',
          color: '#fff',
        },
      });
    }
    // Do not close scanner automatically to allow continuous scanning
    // setShowScanner(false);
  };

  const [manualId, setManualId] = useState('');
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      handleScanSuccess(manualId.trim());
      setManualId('');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu Management', icon: Utensils },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'logs', label: 'Meal Logs', icon: ClipboardList },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'rules', label: 'Rules & Terms', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col relative z-30 shadow-2xl shadow-gray-200/50 dark:shadow-none transition-colors duration-300 hidden lg:flex"
      >
        <div className="p-6 flex items-center gap-4 border-b border-gray-50 dark:border-slate-800">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-blue-900/20">
            <Building2 size={24} />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="text-lg font-black text-gray-800 dark:text-white leading-none tracking-tight">HostelPro</span>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mt-1">Admin Panel</span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`flex items-center w-full gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                activeTab === item.id 
                ? 'bg-violet-600 text-white shadow-xl shadow-violet-200 dark:shadow-violet-900/20' 
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-sm"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 dark:border-slate-800">
          <button
            onClick={() => setShowScanner(true)}
            className={`flex items-center w-full gap-4 px-4 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            <Camera size={22} />
            {isSidebarOpen && <span className="font-bold text-sm">Live Scanner</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-violet-600 transition-all"
        >
          {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 z-[70] lg:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white">
                    <Building2 size={24} />
                  </div>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">HostelPro</span>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as AdminTab);
                      setShowMobileMenu(false);
                    }}
                    className={`flex items-center w-full gap-4 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id 
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' 
                      : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-bold text-sm">{item.label}</span>
                  </button>
                ))}
              </nav>

              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-auto font-bold text-sm"
              >
                <LogOut size={20} />
                Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 relative z-20 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
              {menuItems.find(i => i.id === activeTab)?.label || 'Admin'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-gray-100 dark:border-slate-700"
            >
              {theme === 'light' ? <Moon size={18} className="sm:size-5" /> : <Sun size={18} className="sm:size-5" />}
            </button>

            <div className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-gray-800 dark:text-white leading-none">{user.full_name || 'Admin'}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Super Admin</span>
              </div>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 sm:p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
            >
              <LogOut size={20} className="sm:size-5.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-gray-50/50 dark:bg-slate-950/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto w-full"
            >
              {activeTab === 'dashboard' && <Overview stats={stats} />}
              {activeTab === 'menu' && <MenuLogs isAdmin={true} />}
              {activeTab === 'students' && <StudentManagement students={students} onUpdate={fetchData} />}
              {activeTab === 'rooms' && <RoomManagement onUpdate={fetchData} />}
              {activeTab === 'payments' && <PaymentManagement onUpdate={fetchData} />}
              {activeTab === 'logs' && <MealLogs onUpdate={fetchData} />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'notifications' && <Notifications />}
              {activeTab === 'rules' && <Rules isAdmin={true} />}
              {activeTab === 'settings' && <Settings user={user} onLogout={onLogout} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScanner(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/20 dark:border-white/5"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-violet-500/10 text-violet-500 rounded-2xl">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Mess Access</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Scan student QR code</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8">
                <div className="aspect-square rounded-[2rem] overflow-hidden border-4 border-violet-500/20 relative group">
                  <QRScanner onScanSuccess={handleScanSuccess} />
                  <div className="absolute inset-0 border-[3px] border-violet-500/30 rounded-[2rem] pointer-events-none animate-pulse" />
                  
                  {/* Scanning line animation */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent z-10 opacity-50"
                  />
                </div>
                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg mt-1">
                      <Zap size={16} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Position the student's QR code within the frame to verify their mess access for the current meal session.
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Manual Override</p>
                    <form onSubmit={handleManualSubmit} className="flex gap-3">
                      <input
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="Enter Student ID"
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={!manualId.trim()}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all"
                      >
                        Verify
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/20 dark:border-white/5 p-10 text-center"
              >
                <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LogOut size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Logout</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-10">Are you sure you want to end your session?</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={onLogout}
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                  >
                    Yes, Logout
                  </button>
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {latestPayment && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLatestPayment(null)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/20 dark:border-white/5 p-10"
              >
                <div className="absolute top-6 right-6">
                  <button 
                    onClick={() => setLatestPayment(null)}
                    className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white tracking-tight mb-2">Payment Received</h3>
                <p className="text-sm font-bold text-center text-slate-500 dark:text-slate-400 mb-8">A new payment has been successfully processed.</p>
                
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{latestPayment.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Student Name</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{latestPayment.full_name || latestPayment.user?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Student ID</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{latestPayment.student_id}</span>
                  </div>
                  {latestPayment.user?.room_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Room</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{latestPayment.user.room_number}</span>
                    </div>
                  )}
                  {latestPayment.user?.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{latestPayment.user.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Mode</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{latestPayment.mode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Date</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{latestPayment.date}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setLatestPayment(null)}
                  className="w-full mt-8 py-4 bg-violet-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-violet-500/20 hover:bg-violet-600 transition-all active:scale-95"
                >
                  Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LogOut, Users, ClipboardList, Settings as SettingsIcon, 
  Camera, CreditCard, CheckCircle, XCircle, 
  AlertCircle, LayoutDashboard, Home, 
  BarChart3, Bell, ShieldCheck, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

type AdminTab = 'dashboard' | 'students' | 'rooms' | 'payments' | 'logs' | 'reports' | 'notifications' | 'rules' | 'settings' | 'scanner';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<any>({});
  const [students, setStudents] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/students')
      ]);
      setStats(await statsRes.json());
      setStudents(await studentsRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScanSuccess = async (studentId: string) => {
    try {
      const response = await fetch('/api/meal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Access Granted: ${data.meal}`);
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error recording access');
    }
    setShowScanner(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-gray-100 flex flex-col relative z-30 shadow-2xl shadow-gray-200/50"
      >
        <div className="p-6 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Building2 size={24} />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="font-black text-gray-800 tracking-tighter text-lg">HOSTEL</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest -mt-1">Admin Panel</span>
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
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
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

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={() => setShowScanner(true)}
            className={`flex items-center w-full gap-4 px-4 py-3.5 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            <Camera size={22} />
            {isSidebarOpen && <span className="font-bold text-sm">Live Scanner</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-blue-600 transition-all"
        >
          {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 relative z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
              {menuItems.find(i => i.id === activeTab)?.label || 'Admin'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800 leading-none">{user.full_name || 'Admin'}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Super Admin</span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut size={22} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Overview stats={stats} />}
              {activeTab === 'students' && <StudentManagement students={students} onUpdate={fetchData} />}
              {activeTab === 'rooms' && <RoomManagement onUpdate={fetchData} />}
              {activeTab === 'payments' && <PaymentManagement onUpdate={fetchData} />}
              {activeTab === 'logs' && <MealLogs onUpdate={fetchData} />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'notifications' && <Notifications />}
              {activeTab === 'rules' && <Rules />}
              {activeTab === 'settings' && <Settings user={user} onLogout={onLogout} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Camera size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">Meal Access Scanner</h2>
            <p className="text-gray-500 mb-8">Align the student's QR code within the frame to verify access.</p>
            
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-square mb-8">
              <QRScanner onScanSuccess={handleScanSuccess} />
              <div className="absolute inset-0 border-2 border-blue-500/50 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/30 rounded-3xl pointer-events-none" />
            </div>

            <button 
              onClick={() => setShowScanner(false)}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

// Helper component for Logo
const Building2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
  </svg>
);

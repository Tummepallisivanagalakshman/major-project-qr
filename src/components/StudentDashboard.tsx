import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  LogOut, LogIn, Camera, History, User, CreditCard, 
  Home, Bell, ShieldCheck, Settings, Download, 
  RefreshCw, CheckCircle, XCircle, Clock, Info,
  Phone, Mail, MapPin, Bed, Layers, Building2,
  ChevronRight, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanner from './QRScanner';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  onUpdateUser: (user: any) => void;
}

type Tab = 'dashboard' | 'payments' | 'meals' | 'notifications' | 'terms' | 'settings';

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mealLogs, setMealLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', email: '', phone: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mealRes, payRes, notifRes] = await Promise.all([
        fetch('/api/meal-logs'),
        fetch(`/api/payments/${user.student_id}`),
        fetch(`/api/notifications/${user.student_id}`)
      ]);
      
      const mealData = await mealRes.json();
      setMealLogs(mealData.filter((l: any) => l.student_id === user.student_id));
      setPayments(await payRes.json());
      setNotifications(await notifRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, [user.student_id]);

  useEffect(() => {
    fetchData();
    setEditProfileData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
  }, [fetchData, user.full_name, user.email, user.phone]);

  const handleScanSuccess = async (scannedData: string) => {
    if (scannedData !== 'MESS_ACCESS') {
      alert('Invalid QR! Please scan the Mess Access QR.');
      setShowScanner(false);
      return;
    }
    try {
      const response = await fetch('/api/meal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.student_id }),
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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    if (amount > (user.total_fees - user.paid_amount)) return alert('Amount exceeds pending fees');

    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.student_id, amount, mode: 'UPI' })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateUser(data.user);
        alert('Payment Successful!');
        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchData();
      }
    } catch (err) {
      alert('Payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) return alert('Passwords do not match');
    if (passwordData.new.length < 6) return alert('Password must be at least 6 characters');

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, oldPassword: passwordData.old, newPassword: passwordData.new })
      });
      const data = await res.json();
      if (data.success) {
        alert('Password updated successfully!');
        setPasswordData({ old: '', new: '', confirm: '' });
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Update failed');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setIsUploadingPhoto(true);
      try {
        const res = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            full_name: user.full_name, 
            email: user.email, 
            phone: user.phone, 
            profile_photo: base64 
          })
        });
        const data = await res.json();
        if (data.success) {
          onUpdateUser(data.user);
          alert('Profile photo updated!');
        }
      } catch (err) {
        alert('Upload failed');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          ...editProfileData,
          profile_photo: user.profile_photo 
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateUser(data.user);
        alert('Profile updated successfully!');
        setShowEditProfileModal(false);
      }
    } catch (err) {
      alert('Update failed');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR_${user.student_id}.png`;
      link.href = url;
      link.click();
    }
  };

  const refreshQR = () => {
    setIsRefreshingQR(true);
    setTimeout(() => setIsRefreshingQR(false), 1000);
  };

  const getMealStatus = (type: string) => {
    const today = new Date().toISOString().split('T')[0];
    const taken = mealLogs.some(l => l.meal_type === type && l.date === today);
    return taken ? 'Already Taken' : 'Available';
  };

  const pendingAmount = user.total_fees - user.paid_amount;

  const NavItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-semibold text-sm">{label}</span>
      {id === 'notifications' && notifications.length > 0 && (
        <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
          {notifications.length}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col p-6 hidden lg:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Building2 size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-800">HostelPro</span>
        </div>

        <div className="space-y-2 flex-1">
          <NavItem id="dashboard" icon={Home} label="Dashboard" />
          <NavItem id="payments" icon={CreditCard} label="Payments" />
          <NavItem id="meals" icon={History} label="Meal Access" />
          <NavItem id="notifications" icon={Bell} label="Notifications" />
          <NavItem id="terms" icon={ShieldCheck} label="Rules & Terms" />
          <NavItem id="settings" icon={Settings} label="Settings" />
        </div>

        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-auto font-semibold text-sm"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Layers size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-400 font-medium">ID: {user.student_id}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.full_name?.charAt(0)
                )}
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-bold text-xs"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
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
                className="fixed inset-y-0 left-0 w-72 bg-white z-[70] lg:hidden p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <Building2 size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-800">HostelPro</span>
                  </div>
                  <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  <div onClick={() => setShowMobileMenu(false)}>
                    <NavItem id="dashboard" icon={Home} label="Dashboard" />
                  </div>
                  <div onClick={() => setShowMobileMenu(false)}>
                    <NavItem id="payments" icon={CreditCard} label="Payments" />
                  </div>
                  <div onClick={() => setShowMobileMenu(false)}>
                    <NavItem id="meals" icon={History} label="Meal Access" />
                  </div>
                  <div onClick={() => setShowMobileMenu(false)}>
                    <NavItem id="notifications" icon={Bell} label="Notifications" />
                  </div>
                  <div onClick={() => setShowMobileMenu(false)}>
                    <NavItem id="terms" icon={ShieldCheck} label="Rules & Terms" />
                  </div>
                  <div onClick={() => setShowMobileMenu(false)}>
                    <NavItem id="settings" icon={Settings} label="Settings" />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowMobileMenu(false);
                    onLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-auto font-semibold text-sm"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Top Row: Profile & QR */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Profile Card */}
                  <div className="xl:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative flex flex-col md:flex-row gap-8">
                      <div className="shrink-0">
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-white shadow-lg overflow-hidden">
                            {user.profile_photo ? (
                              <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={64} />
                            )}
                            {isUploadingPhoto && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                                <RefreshCw className="animate-spin" size={24} />
                              </div>
                            )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-all active:scale-90">
                            <Camera size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                          </label>
                        </div>
                        <div className={`mt-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center ${
                          user.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {user.status}
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{user.full_name}</h3>
                            <p className="text-blue-600 font-bold text-sm mt-1">{user.hostel_name} • Block {user.block}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider">ID: {user.student_id}</span>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">{user.room_type}</span>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider">{user.sharing_type} Sharing</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => setShowEditProfileModal(true)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                              Edit Profile
                            </button>
                            <button 
                              onClick={onLogout}
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                              <LogOut size={14} />
                              Logout
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                              <Mail size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</span>
                              <span className="text-sm font-semibold text-gray-700">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                              <Phone size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                              <span className="text-sm font-semibold text-gray-700">{user.phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                              <MapPin size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room</span>
                              <span className="text-sm font-semibold text-gray-700">{user.room_number} ({user.room_type})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                              <Building2 size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hostel</span>
                              <span className="text-sm font-semibold text-gray-700">{user.hostel_name} - {user.block} Block</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Card */}
                  <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Digital ID</h4>
                    <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-100 mb-6 relative">
                      <QRCodeCanvas value={user.student_id} size={160} />
                      {isRefreshingQR && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                          <RefreshCw className="animate-spin text-blue-600" size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full">
                      <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-xs font-bold">
                        <Download size={16} /> Download
                      </button>
                      <button onClick={refreshQR} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                        <RefreshCw size={16} className={isRefreshingQR ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Room & Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Room Details */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-lg font-bold text-gray-800">Room Details</h4>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 size={20} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 font-bold uppercase">Type</p>
                        <p className="font-bold text-gray-700">{user.room_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 font-bold uppercase">Sharing</p>
                        <p className="font-bold text-gray-700">{user.sharing_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 font-bold uppercase">Floor</p>
                        <p className="font-bold text-gray-700">{user.floor}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 font-bold uppercase">Bed Number</p>
                        <p className="font-bold text-gray-700">{user.bed_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-lg font-bold text-gray-800">Fee Summary</h4>
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <CreditCard size={20} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Pending Amount</p>
                        <h5 className="text-3xl font-black text-red-500">₹{pendingAmount.toLocaleString()}</h5>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Due Date</p>
                        <p className="font-bold text-gray-700">{user.next_due_date}</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mb-8 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-1000" 
                        style={{ width: `${(user.paid_amount / user.total_fees) * 100}%` }}
                      ></div>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Meal Status & Recent Activity */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Meal Status */}
                  <div className="xl:col-span-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-6">Today's Meals</h4>
                    <div className="space-y-4">
                      {['Breakfast', 'Lunch', 'Dinner'].map((meal) => {
                        const status = getMealStatus(meal);
                        return (
                          <div key={meal} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                            <div>
                              <p className="font-bold text-gray-700">{meal}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">
                                {meal === 'Breakfast' ? '07:30 - 09:30' : meal === 'Lunch' ? '12:30 - 14:30' : '19:30 - 21:30'}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              status === 'Available' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {status === 'Available' ? <Clock size={12} /> : <CheckCircle size={12} />}
                              {status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="w-full mt-6 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl font-bold hover:border-blue-300 hover:text-blue-500 transition-all"
                    >
                      <Camera size={20} />
                      Scan for Access
                    </button>
                  </div>

                  {/* Recent Notifications */}
                  <div className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold text-gray-800">Recent Notifications</h4>
                      <button onClick={() => setActiveTab('notifications')} className="text-blue-600 text-xs font-bold hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                      {notifications.slice(0, 3).map((n) => (
                        <div key={n.id} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer">
                          <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                            n.type === 'payment' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                            {n.type === 'payment' ? <AlertTriangle size={20} /> : <Info size={20} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold text-gray-800 text-sm">{n.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{n.date}</p>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors self-center" />
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                          <Bell size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-sm font-medium">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Total Fees</p>
                    <p className="text-2xl font-black text-gray-800">₹{user.total_fees.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Paid Amount</p>
                    <p className="text-2xl font-black text-green-600">₹{user.paid_amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Due Amount</p>
                    <p className="text-2xl font-black text-red-500">₹{pendingAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">Transaction History</h4>
                    <button className="text-xs font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-lg">Export PDF</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="px-8 py-4">Date</th>
                          <th className="px-8 py-4">Amount</th>
                          <th className="px-8 py-4">Mode</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4 text-sm font-semibold text-gray-600">{p.date}</td>
                            <td className="px-8 py-4 text-sm font-bold text-gray-800">₹{p.amount.toLocaleString()}</td>
                            <td className="px-8 py-4 text-sm font-medium text-gray-500">{p.mode}</td>
                            <td className="px-8 py-4">
                              <span className="px-2 py-1 rounded-lg bg-green-100 text-green-600 text-[10px] font-bold uppercase">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'meals' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50">
                    <h4 className="font-bold text-gray-800">Meal Access Logs</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="px-8 py-4">Date</th>
                          <th className="px-8 py-4">Meal Type</th>
                          <th className="px-8 py-4">Time</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {mealLogs.map((l) => (
                          <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4 text-sm font-semibold text-gray-600">{l.date}</td>
                            <td className="px-8 py-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                l.meal_type === 'Breakfast' ? 'bg-yellow-100 text-yellow-700' :
                                l.meal_type === 'Lunch' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {l.meal_type}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-sm font-medium text-gray-500">{new Date(l.timestamp).toLocaleTimeString()}</td>
                            <td className="px-8 py-4">
                              <span className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold uppercase">
                                <CheckCircle size={12} /> Verified
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {notifications.map((n) => (
                  <div key={n.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex gap-6">
                    <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
                      n.type === 'payment' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      {n.type === 'payment' ? <AlertTriangle size={24} /> : <Info size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-800">{n.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{n.date}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'terms' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
              >
                <div className="space-y-8">
                  <section>
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Building2 size={20} className="text-blue-600" />
                      Hostel Rules & Regulations
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-600 list-disc pl-5">
                      <li>In-time for all students is 9:30 PM. Late entry requires prior permission.</li>
                      <li>Silence hours are to be observed from 10:00 PM to 6:00 AM.</li>
                      <li>Students are responsible for the cleanliness of their own rooms.</li>
                      <li>Electrical appliances like heaters, induction stoves are strictly prohibited.</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <CreditCard size={20} className="text-blue-600" />
                      Payment & Refund Policy
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-600 list-disc pl-5">
                      <li>Hostel fees must be paid by the 15th of every month.</li>
                      <li>Late payment will incur a fine of ₹100 per day.</li>
                      <li>Refund of security deposit will be processed within 30 days of vacating.</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <History size={20} className="text-blue-600" />
                      Mess Usage Rules
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-600 list-disc pl-5">
                      <li>Meal access is strictly via QR code scan at the counter.</li>
                      <li>Food wastage is strictly discouraged and may lead to fines.</li>
                      <li>Outside food is not allowed inside the mess hall.</li>
                    </ul>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl space-y-8"
              >
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h4 className="text-lg font-bold text-gray-800 mb-6">Change Password</h4>
                  <form className="space-y-4" onSubmit={handleUpdatePassword}>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Current Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordData.old}
                        onChange={(e) => setPasswordData({...passwordData, old: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all" 
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>

                <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
                  <h4 className="text-lg font-bold text-red-800 mb-2">Danger Zone</h4>
                  <p className="text-sm text-red-600 mb-6">Once you logout, you will need to re-authenticate to access your dashboard.</p>
                  <button onClick={onLogout} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">
                    Logout from Device
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-800">Make Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handlePayment} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount to Pay (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Max: ₹${pendingAmount}`}
                    className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-2xl font-black text-gray-800" 
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <CreditCard className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Payment Method</p>
                    <p className="text-xs text-gray-500">UPI / Net Banking / Card</p>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Processing...' : 'Confirm Payment'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showEditProfileModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
                <button onClick={() => setShowEditProfileModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={editProfileData.full_name}
                    onChange={(e) => setEditProfileData({...editProfileData, full_name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={editProfileData.email}
                    onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={editProfileData.phone}
                    onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Updating...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-800">Scan Mess QR</h3>
                <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden border-4 border-blue-50">
                <QRScanner onScanSuccess={handleScanSuccess} />
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-2xl animate-pulse"></div>
              </div>

              <div className="mt-8 flex items-start gap-4 p-4 bg-blue-50 rounded-2xl">
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Align the Mess Counter QR code within the frame to automatically record your meal attendance.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;

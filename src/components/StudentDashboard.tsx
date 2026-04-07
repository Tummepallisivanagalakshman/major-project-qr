import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  LogOut, LogIn, Camera, History, User, CreditCard, 
  Home, Bell, ShieldCheck, Settings, Download, 
  RefreshCw, CheckCircle, XCircle, Clock, Info,
  Phone, Mail, MapPin, Bed, Layers, Building2,
  ChevronRight, AlertTriangle, Sun, Moon, Utensils, Coffee,
  Sparkles, Zap, Shield, Star, CheckCircle2, Calendar, BellOff, X, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanner from './QRScanner';
import { useTheme } from '../context/ThemeContext';
import MenuLogs from './MenuLogs';
import Rules from './admin/Rules';
import { toast } from 'react-hot-toast';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  onUpdateUser: (user: any) => void;
}

type Tab = 'dashboard' | 'payments' | 'meals' | 'notifications' | 'terms' | 'settings' | 'menu';

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mealLogs, setMealLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const fetchData = useCallback(async () => {
    try {
      const [mealRes, payRes, notifRes, menuRes] = await Promise.all([
        fetch(`/api/meal-logs/${user.student_id}`),
        fetch(`/api/payments/${user.student_id}`),
        fetch(`/api/notifications/${user.student_id}`),
        fetch('/api/menu')
      ]);
      
      const mealData = await mealRes.json();
      setMealLogs(Array.isArray(mealData) ? mealData : (mealData.success ? mealData.mealLogs || mealData.data || [] : []));

      const payData = await payRes.json();
      setPayments(Array.isArray(payData) ? payData : (payData.success ? payData.payments || payData.data || [] : []));

      const notifData = await notifRes.json();
      setNotifications(Array.isArray(notifData) ? notifData : (notifData.success ? notifData.notifications || notifData.data || [] : []));

      const menuData = await menuRes.json();
      setMenu(Array.isArray(menuData) ? menuData : (menuData.success ? menuData.menu || menuData.data || [] : []));
    } catch (err) {
      console.error("Error fetching data:", err);
      setMealLogs([]);
      setPayments([]);
      setNotifications([]);
      setMenu([]);
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
      toast.error('Invalid QR Protocol detected.');
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
        toast.success(`Approved: ${data.meal}`);
        fetchData();
        setShowScanner(false);
      } else {
        if (data.message.includes('Already accessed') || data.message.includes('Duplicate')) {
          toast.error('Duplicate QR');
        } else if (data.message.includes('Pending fees') || data.message.includes('Error')) {
          toast.error(`Error: ${data.message}`);
        } else {
          toast.error(data.message);
        }
        setShowScanner(false);
      }
    } catch (err) {
      toast.error('Access verification failed.');
      setShowScanner(false);
    }
  };

  const downloadReceipt = (paymentId: string | number, amount: number, date: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(139, 92, 246); // Violet-500
    doc.text('Hostel Mess Management', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('Payment Receipt', 105, 30, { align: 'center' });
    
    // Receipt Details
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Receipt No: REC-${paymentId}`, 20, 50);
    doc.text(`Date: ${date}`, 20, 60);
    
    // Student Details
    doc.setTextColor(15, 23, 42);
    doc.text('Student Details:', 20, 80);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Name: ${user.full_name}`, 20, 90);
    doc.text(`Student ID: ${user.student_id}`, 20, 100);
    doc.text(`Room: ${user.room_number || 'N/A'} (${user.hostel_name || 'N/A'})`, 20, 110);
    
    // Payment Table
    autoTable(doc, {
      startY: 130,
      head: [['Description', 'Payment Mode', 'Amount']],
      body: [
        ['Hostel & Mess Fee Installment', 'Online (UPI)', `Rs. ${amount.toFixed(2)}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
    });
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, finalY + 30, { align: 'center' });
    
    doc.save(`Receipt_${user.student_id}_${date}.pdf`);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    setIsProcessingPayment(true);
    const loadingToast = toast.loading("Processing secure transaction...");
    try {
      const res = await fetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.student_id, amount, mode: 'UPI' })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateUser(data.user);
        toast.success('Transaction Successful!', { id: loadingToast });
        
        // Generate and download receipt
        const today = new Date().toISOString().split('T')[0];
        downloadReceipt(data.payment_id || Math.floor(Math.random() * 10000), amount, today);
        
        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchData();
      } else {
        toast.error(data.message || 'Payment failed', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Payment gateway error', { id: loadingToast });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) return toast.error('Passwords do not match');
    if (passwordData.new.length < 6) return toast.error('Password must be at least 6 characters');

    setIsUpdatingPassword(true);
    const loadingToast = toast.loading("Updating security credentials...");
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, oldPassword: passwordData.old, newPassword: passwordData.new })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Credentials updated successfully!', { id: loadingToast });
        setPasswordData({ old: '', new: '', confirm: '' });
      } else {
        toast.error(data.message, { id: loadingToast });
      }
    } catch (err) {
      toast.error('Update failed', { id: loadingToast });
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
      const loadingToast = toast.loading("Uploading biometric photo...");
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
          toast.success('Biometric photo updated!', { id: loadingToast });
        } else {
          toast.error('Upload failed', { id: loadingToast });
        }
      } catch (err) {
        toast.error('Network error during upload', { id: loadingToast });
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    const loadingToast = toast.loading("Synchronizing profile data...");
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
        toast.success('Profile synchronized successfully!', { id: loadingToast });
        setShowEditProfileModal(false);
      } else {
        toast.error('Update failed', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Network error during update', { id: loadingToast });
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

  const [qrToken, setQrToken] = useState('');

  const generateQRToken = useCallback(() => {
    const tokenData = {
      student_id: user.student_id,
      timestamp: Date.now()
    };
    // Base64 encode to make it look like a token and avoid simple text tampering
    setQrToken(btoa(JSON.stringify(tokenData)));
  }, [user.student_id]);

  useEffect(() => {
    generateQRToken();
    // Refresh QR every 10 seconds to ensure it's unique and fresh
    const interval = setInterval(generateQRToken, 10000);
    return () => clearInterval(interval);
  }, [generateQRToken]);

  const refreshQR = () => {
    setIsRefreshingQR(true);
    generateQRToken();
    setTimeout(() => setIsRefreshingQR(false), 500);
  };

  const getMealStatus = (type: string) => {
    const today = new Date().toISOString().split('T')[0];
    const taken = mealLogs.some(l => l.meal_type === type && l.date === today);
    return taken ? 'Already Taken' : 'Available';
  };

  const pendingAmount = (user.total_fees || 0) - (user.paid_amount || 0);

  const NavItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center w-full gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
        activeTab === id 
          ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/30 translate-x-1' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110 ${activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-violet-500'}`} />
      <span className="font-black text-[11px] uppercase tracking-[0.15em]">{label}</span>
      {id === 'notifications' && notifications.length > 0 && (
        <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/20 animate-pulse">
          {notifications.length}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#FDFDFD] dark:bg-slate-950 font-sans transition-colors duration-500">
      {/* Sidebar */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/50 flex flex-col p-8 hidden lg:flex transition-all duration-500 relative z-50">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-violet-500/30 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Building2 size={26} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white block leading-none">HostelPro</span>
            <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mt-1 block">Elite Access</span>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <NavItem id="dashboard" icon={Home} label="Dashboard" />
          <NavItem id="menu" icon={Utensils} label="Mess Menu" />
          <NavItem id="payments" icon={CreditCard} label="Payments" />
          <NavItem id="meals" icon={History} label="Meal Access" />
          <NavItem id="notifications" icon={Bell} label="Notifications" />
          <NavItem id="terms" icon={ShieldCheck} label="Rules & Terms" />
          <NavItem id="settings" icon={Settings} label="Settings" />
        </div>

        <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center w-full gap-4 px-5 py-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-[0.2em] group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between px-10 shrink-0 transition-all duration-500 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
            >
              <Layers size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight">{activeTab}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Operational</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              
              <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-2 hidden sm:block"></div>

              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight group-hover:text-violet-600 transition-colors">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID: {user.student_id}</p>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 border-2 border-white dark:border-slate-800 shadow-xl flex items-center justify-center text-violet-600 dark:text-violet-400 font-black overflow-hidden transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                    {user.profile_photo ? (
                      <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user.full_name?.charAt(0)
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg"></div>
                </div>
              </div>
            </div>
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
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
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
                    <NavItem id="menu" icon={Utensils} label="Mess Menu" />
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
                    setShowLogoutConfirm(true);
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'menu' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <MenuLogs />
              </motion.div>
            )}
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Top Row: Profile & QR */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  {/* Profile Card */}
                  <div className="xl:col-span-2 glass-card rounded-[2.5rem] p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-700 group-hover:bg-violet-600/10"></div>
                    <div className="relative flex flex-col md:flex-row gap-10">
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="relative group/photo">
                          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden transition-transform duration-500 group-hover/photo:scale-105 group-hover/photo:rotate-2">
                            {user.profile_photo ? (
                              <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={64} className="opacity-20" />
                            )}
                            <AnimatePresence>
                              {isUploadingPhoto && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white"
                                >
                                  <RefreshCw className="animate-spin" size={32} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl cursor-pointer hover:bg-violet-700 transition-all active:scale-90 border-4 border-white dark:border-slate-800 z-10">
                            <Camera size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                          </label>
                        </div>
                        <div className={`mt-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-center shadow-lg ${
                          user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {user.status} Status
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user.full_name}</h3>
                              <div className="p-1 bg-violet-500 rounded-full">
                                <ShieldCheck size={14} className="text-white" />
                              </div>
                            </div>
                            <p className="text-violet-600 dark:text-violet-400 font-black text-xs uppercase tracking-[0.2em]">{user.hostel_name} • Block {user.block}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">ID: {user.student_id}</span>
                              <span className="px-3 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-violet-500/10">{user.room_type}</span>
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">{user.sharing_type} Sharing</span>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto">
                            <button 
                              onClick={() => setShowEditProfileModal(true)}
                              className="flex-1 sm:flex-none px-6 py-3 bg-violet-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-violet-700 shadow-xl shadow-violet-500/20 transition-all active:scale-95"
                            >
                              Edit Profile
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                          <div className="flex items-center gap-4 group/item">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover/item:bg-violet-500/10 group-hover/item:text-violet-500 transition-colors">
                              <Mail size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Address</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px] sm:max-w-none">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 group/item">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover/item:bg-violet-500/10 group-hover/item:text-violet-500 transition-colors">
                              <Phone size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Number</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 group/item">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover/item:bg-violet-500/10 group-hover/item:text-violet-500 transition-colors">
                              <MapPin size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Room</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.room_number} <span className="text-slate-400 font-medium">({user.room_type})</span></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 group/item">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover/item:bg-violet-500/10 group-hover/item:text-violet-500 transition-colors">
                              <Building2 size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hostel Wing</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.hostel_name} • {user.block} Block</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Card */}
                  <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Secure Digital ID</h4>
                    <div className="p-6 bg-white rounded-[2rem] shadow-2xl border border-slate-100 mb-10 relative group/qr transition-transform duration-500 hover:scale-105">
                      <QRCodeCanvas value={qrToken || user.student_id} size={160} className="sm:size-[180px]" />
                      <AnimatePresence>
                        {isRefreshingQR && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-[2rem]"
                          >
                            <RefreshCw className="animate-spin text-violet-600" size={40} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-3 w-full relative z-10">
                      <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl hover:bg-slate-800 transition-all text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95">
                        <Download size={18} /> Export
                      </button>
                      <button onClick={refreshQR} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                        <RefreshCw size={18} className={isRefreshingQR ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Room & Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Room Details */}
                  <div className="glass-card rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 group">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Room Allocation</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Current Residence Data</p>
                      </div>
                      <div className="p-4 bg-violet-500/10 text-violet-600 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
                        <Bed size={24} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Room Type</p>
                        <p className="font-black text-slate-800 dark:text-slate-200 text-lg">{user.room_type}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Occupancy</p>
                        <p className="font-black text-slate-800 dark:text-slate-200 text-lg">{user.sharing_type} Sharing</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Level / Floor</p>
                        <p className="font-black text-slate-800 dark:text-slate-200 text-lg">{user.floor}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Bed Identifier</p>
                        <p className="font-black text-slate-800 dark:text-slate-200 text-lg">{user.bed_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="glass-card rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 group">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Financial Overview</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Fee & Payment Status</p>
                      </div>
                      <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
                        <CreditCard size={24} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Outstanding Balance</p>
                        <h5 className="text-4xl font-black text-rose-500 tracking-tighter">₹{pendingAmount.toLocaleString()}</h5>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Next Due Date</p>
                        <p className="font-black text-slate-800 dark:text-slate-200">{user.next_due_date}</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mb-10 overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(user.paid_amount / user.total_fees) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      ></motion.div>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Zap size={16} className="text-amber-400" />
                      Initiate Payment
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Meal Status & Recent Activity */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  {/* Meal Status */}
                  <div className="xl:col-span-1 glass-card rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 group">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Catering Service</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Today's Meal Schedule</p>
                      </div>
                      <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl group-hover:rotate-12 transition-transform duration-500">
                        <Utensils size={24} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((meal) => {
                        const status = getMealStatus(meal);
                        const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
                        const todayMenu = menu.find(m => m.day === todayDay);
                        const menuDetail = todayMenu ? todayMenu[meal.toLowerCase()] : 'Loading...';
                        
                        return (
                          <div key={meal} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 group/meal">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-sm ${
                                  meal === 'Breakfast' ? 'bg-amber-500/10 text-amber-600' :
                                  meal === 'Lunch' ? 'bg-emerald-500/10 text-emerald-600' :
                                  meal === 'Snacks' ? 'bg-orange-500/10 text-orange-600' : 'bg-indigo-500/10 text-indigo-600'
                                }`}>
                                  {meal === 'Breakfast' ? <Coffee size={18} /> : 
                                   meal === 'Lunch' ? <Sun size={18} /> : 
                                   meal === 'Snacks' ? <Zap size={18} /> : <Moon size={18} />}
                                </div>
                                <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest text-xs">{meal}</span>
                              </div>
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                status === 'Available' ? 'bg-violet-500/10 text-violet-600 border border-violet-500/10' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'
                              }`}>
                                {status === 'Available' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                                {status}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic font-medium">
                              {menuDetail}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="w-full mt-10 flex items-center justify-center gap-3 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:border-violet-300 dark:hover:border-violet-800 hover:text-violet-500 transition-all active:scale-95"
                    >
                      <Camera size={20} />
                      Scan for Access
                    </button>
                  </div>

                  {/* Recent Notifications */}
                  <div className="xl:col-span-2 glass-card rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 group">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Announcements</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Latest Hostel Updates</p>
                      </div>
                      <div className="p-4 bg-violet-500/10 text-violet-600 rounded-2xl group-hover:rotate-12 transition-transform duration-500 relative">
                        <Bell size={24} />
                        <span className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {notifications.slice(0, 3).map((n) => (
                        <div key={n.id} className="flex gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 group/notif cursor-pointer">
                          <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${
                            n.type === 'payment' ? 'bg-rose-500/10 text-rose-500' : 'bg-violet-500/10 text-violet-500'
                          }`}>
                            {n.type === 'payment' ? <AlertTriangle size={24} /> : <Info size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-black text-slate-800 dark:text-slate-200 text-sm truncate uppercase tracking-widest">{n.title}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap ml-4">{n.date}</p>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                          </div>
                          <div className="self-center p-2 rounded-xl bg-white dark:bg-slate-700 opacity-0 group-hover/notif:opacity-100 transition-all transform translate-x-2 group-hover/notif:translate-x-0">
                            <ChevronRight size={18} className="text-violet-500" />
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                          <Bell size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No new notifications</p>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setActiveTab('notifications')}
                      className="w-full mt-10 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                      View All Notifications
                    </button>
                  </div>

                  {/* Recent Transactions */}
                  <div className="xl:col-span-3 glass-card rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 group">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Transactions</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Financial History</p>
                      </div>
                      <button onClick={() => setActiveTab('payments')} className="px-6 py-2 bg-violet-500/10 text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-500/20 transition-all">View All</button>
                    </div>
                    <div className="overflow-x-auto -mx-10 px-10">
                      <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <th className="px-6 py-2">Transaction Date</th>
                            <th className="px-6 py-2">Amount Paid</th>
                            <th className="px-6 py-2">Payment Mode</th>
                            <th className="px-6 py-2">Current Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.slice(0, 3).map((p) => (
                            <tr key={p.id} className="group/row">
                              <td className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-l-2xl border-y border-l border-slate-100 dark:border-slate-800/30 group-hover/row:bg-white dark:group-hover/row:bg-slate-800 transition-all">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{p.date}</span>
                              </td>
                              <td className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800/30 group-hover/row:bg-white dark:group-hover/row:bg-slate-800 transition-all">
                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">₹{p.amount.toLocaleString()}</span>
                              </td>
                              <td className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800/30 group-hover/row:bg-white dark:group-hover/row:bg-slate-800 transition-all">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                    <CreditCard size={14} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{p.mode}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-r-2xl border-y border-r border-slate-100 dark:border-slate-800/30 group-hover/row:bg-white dark:group-hover/row:bg-slate-800 transition-all">
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No recent transactions</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="glass-card p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm group">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Fees</p>
                      <div className="p-3 bg-violet-500/10 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <CreditCard size={20} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{(user.total_fees || 0).toLocaleString()}</p>
                  </div>
                  <div className="glass-card p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm group">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Paid Amount</p>
                      <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={20} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-emerald-600 tracking-tight">₹{(user.paid_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="glass-card p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm group">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Amount</p>
                      <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <AlertTriangle size={20} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-rose-500 tracking-tight">₹{pendingAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="glass-card rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
                  <div className="p-10 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Transaction History</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Detailed Payment Log</p>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Zap size={16} className="text-amber-400" />
                      Make New Payment
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <th className="px-10 py-6">Date</th>
                          <th className="px-10 py-6">Amount</th>
                          <th className="px-10 py-6">Mode</th>
                          <th className="px-10 py-6">Status</th>
                          <th className="px-10 py-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-slate-400">{p.date}</td>
                            <td className="px-10 py-8 text-sm font-black text-slate-900 dark:text-white tracking-tight">₹{p.amount.toLocaleString()}</td>
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-violet-500 transition-colors">
                                  <CreditCard size={18} />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{p.mode}</span>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">
                                {p.status}
                              </span>
                            </td>
                            <td className="px-10 py-8 text-right">
                              {p.status === 'Success' && (
                                <button 
                                  onClick={() => downloadReceipt(p.id, p.amount, p.date)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors text-xs font-bold"
                                >
                                  <Download size={14} />
                                  Receipt
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {payments.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-20">
                              <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                                  <CreditCard size={40} />
                                </div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No transactions found</p>
                              </div>
                            </td>
                          </tr>
                        )}
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
                className="space-y-10"
              >
                <div className="glass-card rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
                  <div className="p-10 border-b border-slate-100 dark:border-slate-800/50">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Meal Access Logs</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time attendance tracking</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <th className="px-10 py-6">Date</th>
                          <th className="px-10 py-6">Meal Type</th>
                          <th className="px-10 py-6">Time</th>
                          <th className="px-10 py-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {mealLogs.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-slate-400">{l.date}</td>
                            <td className="px-10 py-8">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                l.meal_type === 'Breakfast' ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' :
                                l.meal_type === 'Lunch' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' : 
                                'bg-violet-500/10 text-violet-600 border-violet-500/10'
                              }`}>
                                {l.meal_type}
                              </span>
                            </td>
                            <td className="px-10 py-8 text-sm font-black text-slate-900 dark:text-white tracking-tight">{new Date(l.timestamp).toLocaleTimeString()}</td>
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {mealLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-20">
                              <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                                  <Utensils size={40} />
                                </div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No meal logs found</p>
                              </div>
                            </td>
                          </tr>
                        )}
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
                className="space-y-10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Announcements</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stay updated with latest news</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-violet-500/10 text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-500/10">
                      {notifications.length} New
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {notifications.map((n) => (
                    <motion.div 
                      key={n.id}
                      whileHover={{ y: -5 }}
                      className="glass-card p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="flex items-start gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${
                          n.type === 'payment' ? 'bg-rose-500/10 text-rose-600' : 'bg-violet-500/10 text-violet-600'
                        }`}>
                          {n.type === 'payment' ? <AlertTriangle size={24} /> : <Bell size={24} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{n.title}</h5>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{n.date}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium">{n.message}</p>
                          <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calendar size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{n.date}</span>
                            </div>
                            <button className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:underline">Read More</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-32 glass-card rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                      <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700 mx-auto mb-8">
                        <BellOff size={48} />
                      </div>
                      <h5 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">All caught up!</h5>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No new notifications at this time</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'terms' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <Rules isAdmin={false} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl space-y-10"
              >
                <div className="glass-card p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                      <Lock size={24} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security Settings</h4>
                  </div>
                  <form className="space-y-6" onSubmit={handleUpdatePassword}>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Current Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordData.old}
                        onChange={(e) => setPasswordData({...passwordData, old: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300" 
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isUpdatingPassword ? 'Updating Security...' : 'Update Password'}
                    </button>
                  </form>
                </div>

                <div className="glass-card p-10 rounded-[2.5rem] shadow-sm border border-rose-100 dark:border-rose-900/20 bg-rose-50/30 dark:bg-rose-900/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <LogOut size={24} />
                    </div>
                    <h4 className="text-2xl font-black text-rose-800 dark:text-rose-400 tracking-tight">Danger Zone</h4>
                  </div>
                  <p className="text-sm font-medium text-rose-600/80 dark:text-rose-400/60 mb-8">Once you logout, you will need to re-authenticate to access your dashboard. All active sessions will be terminated.</p>
                  <button onClick={onLogout} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800/50"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Make Payment</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Secure Transaction</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handlePayment} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Amount to Pay (₹)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₹</span>
                    <input 
                      type="number" 
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`Max: ${pendingAmount}`}
                      className="w-full pl-12 pr-6 py-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-3xl font-black text-slate-900 dark:text-white tracking-tight" 
                    />
                  </div>
                </div>

                <div className="p-6 bg-violet-500/5 dark:bg-violet-500/10 rounded-[2rem] flex items-center gap-5 border border-violet-500/10">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-violet-600">
                    <CreditCard size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Payment Method</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UPI / Net Banking / Card</p>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-5 bg-violet-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="text-amber-400" />
                      Confirm Payment
                    </>
                  )}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800/50"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Edit Profile</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Update Information</p>
                </div>
                <button onClick={() => setShowEditProfileModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={editProfileData.full_name}
                    onChange={(e) => setEditProfileData({...editProfileData, full_name: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={editProfileData.email}
                    onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={editProfileData.phone}
                    onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-5 bg-violet-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile'}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800/50"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Scan Mess QR</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Attendance Verification</p>
                </div>
                <button onClick={() => setShowScanner(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-100 dark:border-slate-800/50 shadow-inner">
                <QRScanner onScanSuccess={handleScanSuccess} />
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-violet-500 rounded-3xl animate-pulse"></div>
              </div>

              <div className="mt-8 flex items-start gap-4 p-6 bg-violet-500/5 dark:bg-violet-500/10 rounded-[2rem] border border-violet-500/10">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-violet-600 shrink-0">
                  <Info size={20} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                  Align the Mess Counter QR code within the frame to automatically record your meal attendance.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800/50 text-center"
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
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;

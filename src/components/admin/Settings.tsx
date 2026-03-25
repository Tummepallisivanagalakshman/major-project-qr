import React, { useState } from 'react';
import { 
  User, Lock, Shield, Settings as SettingsIcon,
  CheckCircle, XCircle, AlertTriangle, 
  Info, Save, LogOut, Mail, Phone,
  ShieldCheck, Key, Sparkles, Zap, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface SettingsProps {
  user: any;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, oldPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (err) {
      toast.error('Error updating password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-violet-500" size={32} />
            System Configuration
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Manage your administrative profile and security protocols.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-violet-500/10 text-violet-500 rounded-2xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Admin Profile</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Personal identification</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-violet-500/20 group-hover:scale-105 transition-transform duration-500">
                  {user.full_name?.charAt(0) || user.username?.charAt(0)}
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg border-4 border-white dark:border-slate-900">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.full_name || 'System Admin'}</h4>
                <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">@{user.username}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <Zap size={12} />
                  Super Admin Access
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Mail size={12} />
                  Email Address
                </label>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-700 dark:text-slate-300 font-bold border border-slate-100 dark:border-slate-800 shadow-inner">
                  {user.email || 'admin@hostel.com'}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Phone size={12} />
                  Phone Number
                </label>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-700 dark:text-slate-300 font-bold border border-slate-100 dark:border-slate-800 shadow-inner">
                  {user.phone || '+91 98765 43210'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Key size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Security Protocol</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Credential management</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Current Password</label>
              <input 
                required
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">New Password</label>
              <input 
                required
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
              <input 
                required
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <button 
              disabled={isUpdating}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isUpdating ? (
                <Activity size={16} className="animate-spin" />
              ) : (
                <Shield size={16} />
              )}
              {isUpdating ? 'Updating Protocol...' : 'Commit New Credentials'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Danger Zone */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-rose-500/5 dark:bg-rose-500/10 p-10 rounded-[3rem] border border-rose-500/20 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
          <AlertTriangle size={150} className="text-rose-500" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
            <div className="p-5 bg-rose-500/20 text-rose-500 rounded-3xl shadow-lg shadow-rose-500/10">
              <Shield size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-rose-900 dark:text-rose-400 tracking-tight">Danger Zone</h3>
              <p className="text-rose-600/70 dark:text-rose-400/60 font-medium mt-1">Terminate current administrative session and clear local cache.</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-10 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-700 hover:scale-105 transition-all shadow-2xl shadow-rose-600/20"
          >
            <LogOut size={20} />
            Terminate Session
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;

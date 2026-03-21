import React, { useState } from 'react';
import { 
  User, Lock, Shield, Settings as SettingsIcon,
  CheckCircle, XCircle, AlertTriangle, 
  Info, Save, LogOut
} from 'lucide-react';

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
      alert('Passwords do not match');
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
        alert('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error updating password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Settings</h2>
          <p className="text-gray-500">Manage your profile and security preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Admin Profile
          </h3>
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white font-bold text-3xl">
                {user.full_name?.charAt(0) || user.username?.charAt(0)}
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-800">{user.full_name || 'System Admin'}</h4>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-600 font-medium border border-gray-100">
                  {user.email || 'admin@hostel.com'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-600 font-medium border border-gray-100">
                  {user.phone || '+91 98765 43210'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Lock size={20} className="text-blue-600" />
            Security & Password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Current Password</label>
              <input 
                required
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">New Password</label>
              <input 
                required
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Confirm New Password</label>
              <input 
                required
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              disabled={isUpdating}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800">Danger Zone</h3>
              <p className="text-sm text-red-600">Logout from the system and clear your session.</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
          >
            <LogOut size={20} />
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

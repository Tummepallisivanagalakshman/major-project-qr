import React, { useState } from 'react';
import * as api from '../../lib/api';
import { 
  Bell, Send, AlertTriangle, 
  Info, CreditCard, X, 
  CheckCircle, MessageSquare, Sparkles,
  History, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('admin');
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await api.broadcastNotification({ title, message, type });
      toast.success('Announcement broadcasted successfully!', {
        icon: '🚀',
        style: {
          borderRadius: '1rem',
          background: '#1e293b',
          color: '#fff',
        },
      });
      setTitle('');
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Error broadcasting announcement');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="text-violet-500" size={32} />
            Broadcast Center
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Dispatch critical updates and announcements to the entire student body.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7"
        >
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Send size={120} className="text-violet-500" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Send size={20} className="text-violet-500" />
              </div>
              Compose Broadcast
            </h3>
            
            <form onSubmit={handleBroadcast} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Message Headline</label>
                <input 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white font-bold"
                  placeholder="e.g. Scheduled Maintenance"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Priority Category</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'admin', label: 'General', icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'payment', label: 'Finance', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { id: 'emergency', label: 'Urgent', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id)}
                      className={`flex flex-col items-center gap-3 p-5 rounded-[1.5rem] border-2 transition-all relative group ${
                        type === item.id 
                        ? 'border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10' 
                        : 'border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={24} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${type === item.id ? 'text-violet-500' : 'text-slate-500'}`}>
                        {item.label}
                      </span>
                      {type === item.id && (
                        <motion.div layoutId="active-type" className="absolute -top-1 -right-1">
                          <CheckCircle size={16} className="text-violet-500 fill-white dark:fill-slate-900" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Detailed Content</label>
                <textarea 
                  required
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white font-medium resize-none"
                  placeholder="Describe the update in detail..."
                />
              </div>
              
              <button 
                disabled={isSending}
                className="w-full py-5 bg-violet-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-violet-700 shadow-xl shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {isSending ? (
                  <>
                    <Zap size={20} className="animate-pulse" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Dispatch Announcement
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-8"
        >
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Zap size={200} />
            </div>
            
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <Sparkles size={24} className="text-violet-200" />
              Smart Templates
            </h3>
            <div className="space-y-4 relative z-10">
              {[
                { title: 'Payment Reminder', body: 'Gentle reminder: Please clear your hostel dues by the 15th to avoid late fees.', type: 'payment', icon: CreditCard },
                { title: 'Utility Update', body: 'Water supply will be temporarily suspended tomorrow from 10 AM to 2 PM for maintenance.', type: 'admin', icon: Info },
                { title: 'Safety Drill', body: 'Mandatory fire safety drill scheduled for this evening at 5 PM in the main courtyard.', type: 'emergency', icon: AlertTriangle }
              ].map((t, i) => (
                <button 
                  key={i}
                  onClick={() => { setTitle(t.title); setMessage(t.body); setType(t.type); }}
                  className="w-full p-5 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition-all border border-white/10 flex items-start gap-4 group/item"
                >
                  <div className="p-2 bg-white/10 rounded-lg group-hover/item:scale-110 transition-transform">
                    <t.icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm mb-1 tracking-tight">{t.title}</h4>
                    <p className="text-xs text-white/60 line-clamp-1 font-medium">{t.body}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <History size={24} className="text-slate-400" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[
                { title: 'Maintenance Update', stats: '124 students', time: '2 hours ago', type: 'admin', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { title: 'Fee Reminder', stats: '124 students', time: '1 day ago', type: 'payment', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
              ].map((log, i) => (
                <div key={i} className="flex gap-4 p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/50 group hover:border-violet-500/30 transition-colors">
                  <div className={`p-3 ${log.bg} ${log.color} rounded-xl h-fit group-hover:scale-110 transition-transform`}>
                    {log.type === 'admin' ? <Info size={18} /> : <CreditCard size={18} />}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white tracking-tight">{log.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent to {log.stats}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Notifications;

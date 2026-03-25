import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  CreditCard, Search, Filter, Plus, 
  CheckCircle, XCircle, Clock, 
  TrendingUp, TrendingDown, DollarSign,
  Download, FileText, X, Sparkles,
  ArrowUpRight, ArrowDownRight, Activity,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface PaymentManagementProps {
  onUpdate: () => void;
}

const PaymentManagement: React.FC<PaymentManagementProps> = React.memo(({ onUpdate }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Success' | 'Pending' | 'Failed'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : (data.success ? data.payments : []));
    } catch (err) {
      console.error("Error fetching payments:", err);
      setPayments([]);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    
    const socket = io();
    socket.on('payment_received', () => {
      fetchPayments();
      onUpdate();
    });
    
    return () => {
      socket.disconnect();
    };
  }, [fetchPayments, onUpdate]);

  const filteredPayments = React.useMemo(() => {
    if (!Array.isArray(payments)) return [];
    return payments.filter(p => {
      const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.student_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, filterStatus]);

  const totalRevenue = payments.filter(p => p.status === 'Success').reduce((acc, p) => acc + p.amount, 0);

  const PaymentForm = () => {
    const [formData, setFormData] = useState({
      student_id: '',
      amount: 0,
      mode: 'Cash',
      status: 'Success',
      date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/admin/payments/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Payment recorded successfully!');
          setShowAddModal(false);
          fetchPayments();
          onUpdate();
        }
      } catch (err) {
        toast.error('Error adding payment');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Student Identifier</label>
            <input 
              required
              value={formData.student_id}
              onChange={e => setFormData({...formData, student_id: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white font-bold"
              placeholder="e.g. STU123"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Transaction Amount (₹)</label>
            <input 
              required
              type="number"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
              className="w-full px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white font-bold"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Payment Method</label>
            <select 
              value={formData.mode}
              onChange={e => setFormData({...formData, mode: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white font-bold appearance-none"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Transaction Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white font-bold appearance-none"
            >
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Transaction Date</label>
            <input 
              required
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white font-bold"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-10">
          <button 
            type="button"
            onClick={() => setShowAddModal(false)}
            className="px-8 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={isSubmitting}
            className="px-10 py-4 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-widest hover:bg-violet-700 shadow-xl shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : (
              <>
                <CheckCircle size={20} />
                Confirm Entry
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+12.5%', trendIcon: ArrowUpRight },
          { label: 'Avg. Payment', value: `₹${(totalRevenue / (payments.length || 1)).toFixed(0)}`, icon: DollarSign, color: 'text-violet-500', bg: 'bg-violet-500/10', trend: '+5.2%', trendIcon: ArrowUpRight },
          { label: 'Pending Entries', value: payments.filter(p => p.status === 'Pending').length, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: '-2.4%', trendIcon: ArrowDownRight }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-xl group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.trend}
                <stat.trendIcon size={14} />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white text-sm"
            placeholder="Search by student name or ID..."
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="pl-10 pr-8 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm outline-none font-black text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest appearance-none min-w-[160px]"
            >
              <option value="All">All Status</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
          >
            <Plus size={20} />
            Manual Entry
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-6">Student Details</th>
                <th className="px-8 py-6">Amount</th>
                <th className="px-8 py-6">Date & Method</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((p, i) => (
                <motion.tr 
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">{p.full_name}</span>
                      <span className="text-xs text-slate-400 font-mono tracking-tighter">{p.student_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-lg font-black text-slate-900 dark:text-white">₹{p.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {p.date}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-400" />
                        {p.mode}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      p.status === 'Success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 
                      p.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {p.status === 'Success' ? <CheckCircle size={14} /> : 
                       p.status === 'Pending' ? <Clock size={14} /> : <XCircle size={14} />}
                      {p.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-3 text-slate-400 hover:text-violet-500 hover:bg-violet-500/10 rounded-xl transition-all" title="View Receipt">
                      <FileText size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/20 dark:border-white/5"
            >
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Sparkles className="text-violet-500" size={28} />
                    Manual Transaction
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Record a new payment entry manually into the system.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <div className="p-10">
                <PaymentForm />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default PaymentManagement;

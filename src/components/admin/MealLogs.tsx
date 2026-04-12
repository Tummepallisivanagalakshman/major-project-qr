import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { 
  ClipboardList, Search, Filter, 
  CheckCircle, XCircle, Clock, 
  Calendar, Coffee, Sun, Moon,
  Download, FileText, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MealLogsProps {
  onUpdate: () => void;
}

const MealLogs: React.FC<MealLogsProps> = React.memo(({ onUpdate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMeal, setFilterMeal] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner'>('All');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchLogs = React.useCallback(async () => {
    try {
      const data = await api.getAllMealLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch meal logs:', err);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = React.useMemo(() => {
    if (!Array.isArray(logs)) return [];
    return logs.filter(l => {
      const matchesSearch = l.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.student_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMeal = filterMeal === 'All' || l.meal_type === filterMeal;
      const matchesDate = !filterDate || l.date === filterDate;
      return matchesSearch && matchesMeal && matchesDate;
    });
  }, [logs, searchTerm, filterMeal, filterDate]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white text-sm"
            placeholder="Search by student name or ID..."
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="pl-10 pr-4 py-4 rounded-2xl border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm outline-none font-bold text-slate-600 dark:text-slate-400 text-sm appearance-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterMeal}
              onChange={e => setFilterMeal(e.target.value as any)}
              className="pl-10 pr-8 py-4 rounded-2xl border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm outline-none font-bold text-slate-600 dark:text-slate-400 text-sm appearance-none min-w-[160px]"
            >
              <option value="All">All Meals</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>
          <button className="flex items-center justify-center p-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all" title="Export Logs">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-6">Student Information</th>
                <th className="px-8 py-6">Meal Category</th>
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">Access Status</th>
                <th className="px-8 py-6 text-right">Verification Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((l, i) => (
                <motion.tr 
                  key={l.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white text-base truncate">{l.username}</span>
                      <span className="text-xs text-slate-400 font-mono tracking-tighter truncate">{l.student_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        l.meal_type === 'Breakfast' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                        l.meal_type === 'Lunch' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {l.meal_type === 'Breakfast' ? <Coffee size={18} /> : 
                         l.meal_type === 'Lunch' ? <Sun size={18} /> : <Moon size={18} />}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{l.meal_type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {l.date}
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle size={14} />
                      Authorized
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Sparkles size={14} className="text-violet-500" />
                      QR Verified
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <ClipboardList size={48} className="opacity-20" />
                      <p className="font-bold">No meal logs found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default MealLogs;

import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, Cell
} from 'recharts';
import { 
  Download, FileText, Calendar, 
  TrendingUp, TrendingDown, PieChart as PieIcon,
  Sparkles, Activity, Target, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const Reports: React.FC = () => {
  const [mealStats, setMealStats] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<any[]>([]);

  const fetchReports = async () => {
    try {
      const [mealData, revData] = await Promise.all([
        api.getMealStats(),
        api.getRevenueStats()
      ]);
      
      setMealStats(mealData || []);
      setRevenueStats(revData || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setMealStats([]);
      setRevenueStats([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Value'];
    const safeMealStats = Array.isArray(mealStats) ? mealStats : [];
    const safeRevenueStats = Array.isArray(revenueStats) ? revenueStats : [];
    
    const rows = [
      ...safeMealStats.map(m => [m.date, 'Meal Count', m.count]),
      ...safeRevenueStats.map(r => [r.date, 'Revenue', r.total])
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hostel_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="text-violet-500" size={32} />
            Analytics Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Deep insights into hostel operations, revenue, and student engagement.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-xl shadow-slate-900/10 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <FileText size={18} />
            Print Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <TrendingUp size={24} className="text-emerald-500" />
              Revenue Trends
            </h3>
            <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              Last 30 Days
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.isArray(revenueStats) ? revenueStats : []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    background: '#1e293b',
                    color: '#fff',
                    padding: '1rem'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 800 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  strokeWidth={4} 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Zap size={24} className="text-amber-500" />
              Meal Engagement
            </h3>
            <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
              Usage Stats
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Array.isArray(mealStats) ? mealStats : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    background: '#1e293b',
                    color: '#fff',
                    padding: '1rem'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 800 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 700 }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={2000}>
                  {(Array.isArray(mealStats) ? mealStats : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Sparkles size={120} className="text-violet-500" />
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-10 flex items-center gap-3">
          <Target size={28} className="text-violet-500" />
          Executive Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { label: 'Growth', value: '+12.5%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Compared to last month' },
            { label: 'Defaulters', value: '4.2%', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10', desc: 'Students with overdue payments' },
            { label: 'Occupancy', value: '88%', icon: PieIcon, color: 'text-violet-500', bg: 'bg-violet-500/10', desc: 'Total capacity utilized' }
          ].map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative group p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-700/50 hover:border-violet-500/30 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 ${metric.bg} ${metric.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                  <metric.icon size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{metric.label}</span>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{metric.value}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{metric.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;

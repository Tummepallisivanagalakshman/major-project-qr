import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Users, Home, CreditCard, Utensils, 
  Download, QrCode, TrendingUp, ArrowUpRight,
  Activity, Zap, Sparkles, PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { motion } from 'framer-motion';

interface OverviewProps {
  stats: any;
}

const Overview: React.FC<OverviewProps> = React.memo(({ stats }) => {
  const downloadMessQR = () => {
    const canvas = document.getElementById('mess-qr') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'mess-access-qr.png';
      link.href = url;
      link.click();
    }
  };

  const roomData = [
    { name: 'Occupied', value: stats.rooms?.occupied || 0, color: '#8B5CF6' }, // Violet-500
    { name: 'Available', value: stats.rooms?.available || 0, color: '#10B981' }, // Emerald-500
  ];

  const mealData = [
    { name: 'Breakfast', count: stats.today_meals?.Breakfast || 0 },
    { name: 'Lunch', count: stats.today_meals?.Lunch || 0 },
    { name: 'Dinner', count: stats.today_meals?.Dinner || 0 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle, delay }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl group hover-lift"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/10`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</span>
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
            <TrendingUp size={12} />
            Live
          </div>
        </div>
      </div>
      <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">{title}</h3>
      {subtitle && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-black uppercase tracking-widest flex items-center gap-2">
          <Activity size={12} className="text-violet-500" />
          {subtitle}
        </p>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Zap className="text-amber-500" size={32} />
            System Pulse
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Real-time operational intelligence and analytics.</p>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Monitoring Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Total Students" 
          value={stats.students?.total || 0} 
          icon={Users} 
          color="bg-violet-500"
          subtitle={`${stats.students?.active || 0} Active Residents`}
          delay={0.1}
        />
        <StatCard 
          title="Total Rooms" 
          value={stats.rooms?.total || 0} 
          icon={Home} 
          color="bg-indigo-500"
          subtitle={`${stats.rooms?.available || 0} Units Available`}
          delay={0.2}
        />
        <StatCard 
          title="Revenue" 
          value={`₹${stats.payments?.total_received?.toLocaleString() || 0}`} 
          icon={CreditCard} 
          color="bg-emerald-500"
          subtitle={`₹${stats.payments?.pending?.toLocaleString() || 0} Outstanding`}
          delay={0.3}
        />
        <StatCard 
          title="Mess Activity" 
          value={(stats.today_meals?.Breakfast || 0) + (stats.today_meals?.Lunch || 0) + (stats.today_meals?.Dinner || 0)} 
          icon={Utensils} 
          color="bg-orange-500"
          subtitle="Total Scans Today"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 text-violet-500 rounded-2xl">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Meal Distribution</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Daily consumption patterns</p>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor' }} 
                  className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest" 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor' }} 
                  className="text-slate-400 dark:text-slate-500 text-[10px] font-black" 
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff',
                    padding: '16px 24px'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[12, 12, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Sparkles size={120} className="text-violet-500" />
          </div>
          
          <div className="w-20 h-20 bg-violet-500/10 text-violet-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
            <QrCode size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Mess Access QR</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 px-6 leading-relaxed font-medium">
            Deploy this QR at the counter for automated attendance tracking.
          </p>
          
          <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 mb-10 relative group-hover:scale-105 transition-transform">
            <QRCodeCanvas id="mess-qr" value="MESS_ACCESS" size={180} level="H" />
          </div>
          
          <button 
            onClick={downloadMessQR}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
          >
            <Download size={18} /> Download Asset
          </button>
        </motion.div>
      </div>

      {/* Occupancy Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <PieIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Capacity Analytics</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Room utilization metrics</p>
          </div>
        </div>
        
        <div className="h-[300px] flex flex-col md:flex-row items-center justify-center gap-16">
          <div className="w-full h-full max-w-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {roomData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff',
                    padding: '12px 20px'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{stats.rooms?.total || 0}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-6 w-full md:w-auto">
            {roomData.map((item) => (
              <div key={item.name} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.name}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default Overview;

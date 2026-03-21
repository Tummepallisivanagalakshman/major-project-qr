import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, Calendar, 
  TrendingUp, TrendingDown, PieChart as PieIcon
} from 'lucide-react';

const Reports: React.FC = () => {
  const [mealStats, setMealStats] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<any[]>([]);

  const fetchReports = async () => {
    const [mealRes, revRes] = await Promise.all([
      fetch('/api/admin/reports/meals'),
      fetch('/api/admin/reports/revenue')
    ]);
    setMealStats(await mealRes.json());
    setRevenueStats(await revRes.json());
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Value'];
    const rows = [
      ...mealStats.map(m => [m.date, 'Meal Count', m.count]),
      ...revenueStats.map(r => [r.date, 'Revenue', r.total])
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-500">Analyze hostel performance and trends.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all font-bold text-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all font-bold text-sm"
          >
            <FileText size={18} />
            Print Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trends (Last 30 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueStats}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Meal Usage Statistics</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Summary Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-emerald-500" />
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Growth</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">+12.5%</div>
            <p className="text-xs text-gray-400 mt-1">Compared to last month</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown size={20} className="text-red-500" />
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Defaulters</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">4.2%</div>
            <p className="text-xs text-gray-400 mt-1">Students with overdue payments</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <PieIcon size={20} className="text-blue-500" />
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Occupancy Rate</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">88%</div>
            <p className="text-xs text-gray-400 mt-1">Total capacity utilized</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

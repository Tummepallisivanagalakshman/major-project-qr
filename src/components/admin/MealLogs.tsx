import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, Filter, 
  CheckCircle, XCircle, Clock, 
  Calendar, Coffee, Sun, Moon,
  Download, FileText
} from 'lucide-react';

interface MealLogsProps {
  onUpdate: () => void;
}

const MealLogs: React.FC<MealLogsProps> = React.memo(({ onUpdate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMeal, setFilterMeal] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner'>('All');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchLogs = React.useCallback(async () => {
    const res = await fetch('/api/meal-logs');
    const data = await res.json();
    setLogs(data);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = React.useMemo(() => {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Search by student name or ID..."
          />
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm outline-none font-medium text-gray-600"
          />
          <select 
            value={filterMeal}
            onChange={e => setFilterMeal(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm outline-none font-medium text-gray-600"
          >
            <option value="All">All Meals</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </select>
          <button className="p-3 bg-white text-gray-600 rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-widest">
                <th className="px-8 py-5 font-bold">Student</th>
                <th className="px-8 py-5 font-bold">Meal Type</th>
                <th className="px-8 py-5 font-bold">Date & Time</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{l.username}</span>
                      <span className="text-xs text-gray-400 font-mono tracking-tighter">{l.student_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        l.meal_type === 'Breakfast' ? 'bg-yellow-50 text-yellow-600' :
                        l.meal_type === 'Lunch' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {l.meal_type === 'Breakfast' ? <Coffee size={16} /> : 
                         l.meal_type === 'Lunch' ? <Sun size={16} /> : <Moon size={16} />}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{l.meal_type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-gray-700">{l.date}</div>
                      <div className="text-xs text-gray-400 font-mono">{new Date(l.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                      <CheckCircle size={14} />
                      Allowed
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">QR Verified</div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">
                    No meal logs found for the selected filters.
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

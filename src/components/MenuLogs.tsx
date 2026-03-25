import React, { useState, useEffect } from 'react';
import { 
  Utensils, Coffee, Sun, Moon, 
  Clock, Edit2, Check, X, 
  ChevronRight, Calendar, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface MenuLogsProps {
  isAdmin?: boolean;
}

const MenuLogs: React.FC<MenuLogsProps> = ({ isAdmin = false }) => {
  const [menu, setMenu] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenu(Array.isArray(data) ? data : (data.success ? data.menu : []));
    } catch (err) {
      console.error("Error fetching menu:", err);
      toast.error("Failed to synchronize menu data.");
      setMenu([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const handleSave = async () => {
    if (!editData) return;
    try {
      const res = await fetch(`/api/menu/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        setEditingId(null);
        toast.success("Menu updated successfully.");
        fetchMenu();
      } else {
        toast.error("Failed to update menu.");
      }
    } catch (err) {
      console.error("Error saving menu:", err);
      toast.error("Network error during save.");
    }
  };

  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 blur-lg bg-violet-500/10 animate-pulse"></div>
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Culinary Data</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Weekly Mess Menu
            <Sparkles className="text-violet-500" size={24} />
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Premium Indian culinary schedule for the current cycle.</p>
        </div>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-violet-500/10 dark:bg-violet-500/5 text-violet-600 dark:text-violet-400 rounded-2xl border border-violet-500/20 backdrop-blur-md">
          <Calendar size={20} />
          <span className="font-black text-xs uppercase tracking-widest">Today: {currentDay}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {menu.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            layout
            className={`glass-card rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
              item.day === currentDay 
                ? 'border-violet-500/50 shadow-2xl shadow-violet-500/10 ring-1 ring-violet-500/20' 
                : 'border-white/20 dark:border-white/5 shadow-sm'
            }`}
          >
            <div className={`p-8 border-b border-white/10 dark:border-white/5 flex items-center justify-between ${
              item.day === currentDay ? 'bg-violet-500/5' : ''
            }`}>
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 hover:rotate-12 ${
                  item.day === currentDay ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <span className="font-black text-xl">{item.day.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                    {item.day}
                    {item.day === currentDay && (
                      <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black shadow-lg shadow-emerald-500/20">Active Today</span>
                    )}
                  </h3>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-3">
                  {editingId === item.id ? (
                    <>
                      <button 
                        onClick={handleSave}
                        className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-90"
                      >
                        <Check size={20} />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
                    >
                      <Edit2 size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {/* Breakfast */}
              <div className="space-y-4 group">
                <div className="flex items-center gap-3 text-amber-500">
                  <div className="p-2 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Coffee size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Breakfast</span>
                </div>
                {editingId === item.id ? (
                  <textarea 
                    value={editData.breakfast}
                    onChange={e => setEditData({...editData, breakfast: e.target.value})}
                    className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none resize-none h-32 font-bold transition-all"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic">
                    {item.breakfast}
                  </p>
                )}
              </div>

              {/* Lunch */}
              <div className="space-y-4 group">
                <div className="flex items-center gap-3 text-emerald-500">
                  <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Sun size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lunch</span>
                </div>
                {editingId === item.id ? (
                  <textarea 
                    value={editData.lunch}
                    onChange={e => setEditData({...editData, lunch: e.target.value})}
                    className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none resize-none h-32 font-bold transition-all"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic">
                    {item.lunch}
                  </p>
                )}
              </div>

              {/* Snacks */}
              <div className="space-y-4 group">
                <div className="flex items-center gap-3 text-orange-500">
                  <div className="p-2 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Utensils size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Snacks</span>
                </div>
                {editingId === item.id ? (
                  <textarea 
                    value={editData.snacks}
                    onChange={e => setEditData({...editData, snacks: e.target.value})}
                    className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none resize-none h-32 font-bold transition-all"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic">
                    {item.snacks}
                  </p>
                )}
              </div>

              {/* Dinner */}
              <div className="space-y-4 group">
                <div className="flex items-center gap-3 text-indigo-500">
                  <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Moon size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dinner</span>
                </div>
                {editingId === item.id ? (
                  <textarea 
                    value={editData.dinner}
                    onChange={e => setEditData({...editData, dinner: e.target.value})}
                    className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none resize-none h-32 font-bold transition-all"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic">
                    {item.dinner}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MenuLogs;

import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { 
  ShieldCheck, Plus, Edit2, Trash2, 
  CheckCircle, XCircle, AlertTriangle, 
  Info, X, Save, Building2, Utensils, 
  CreditCard, Sparkles, Zap, Activity,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface RulesProps {
  isAdmin?: boolean;
}

const Rules: React.FC<RulesProps> = ({ isAdmin = false }) => {
  const [rules, setRules] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({ category: 'Hostel', content: '' });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const fetchRules = async () => {
    try {
      const data = await api.getRules();
      setRules(data || []);
    } catch (err) {
      toast.error('Failed to fetch rules');
      setRules([]);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleUpdate = async (id: any) => {
    try {
      await api.updateRule(id, { content: editContent });
      toast.success('Rule updated successfully');
      setEditingRule(null);
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || 'Error updating rule');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addRule(newRule);
      toast.success('New rule added');
      setShowAddModal(false);
      setNewRule({ category: 'Hostel', content: '' });
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || 'Error adding rule');
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.deleteRule(id);
      toast.success('Rule deleted');
      fetchRules();
      setShowDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting rule');
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Hostel': return <Building2 size={24} className="text-violet-500" />;
      case 'Mess': return <Utensils size={24} className="text-emerald-500" />;
      case 'Payment': return <CreditCard size={24} className="text-amber-500" />;
      default: return <Info size={24} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Scale className="text-violet-500" size={32} />
            Policy Framework
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Define and maintain the regulatory standards for hostel life.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
          >
            <Plus size={20} />
            Add New Rule
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10">
        {['Hostel', 'Mess', 'Payment'].map((cat, catIdx) => (
          <motion.div 
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.1 }}
            className="glass-card rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden"
          >
            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                  {getIcon(cat)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{cat} Regulations</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Core governing policies</p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-full bg-violet-500/10 text-violet-500 text-[10px] font-black uppercase tracking-widest">
                {rules.filter(r => r.category === cat).length} Clauses
              </div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {rules.filter(r => r.category === cat).map((rule, ruleIdx) => (
                <motion.div 
                  key={rule.id}
                  layout
                  className="p-8 flex items-start justify-between gap-8 group hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-all"
                >
                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      {editingRule === rule.id ? (
                        <motion.div 
                          key="edit"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-6"
                        >
                          <textarea 
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-500/30 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all resize-none font-medium text-slate-700 dark:text-slate-300"
                            rows={4}
                          />
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleUpdate(rule.id)}
                              className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 shadow-lg shadow-violet-200 dark:shadow-none transition-all"
                            >
                              <Save size={16} />
                              Commit Changes
                            </button>
                            <button 
                              onClick={() => setEditingRule(null)}
                              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                              Discard
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="view"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex items-start gap-6"
                        >
                          <div className="mt-2.5 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] flex-shrink-0" />
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-lg">{rule.content}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {isAdmin && !editingRule && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => { setEditingRule(rule.id); setEditContent(rule.content); }}
                        className="p-3 text-slate-400 hover:text-violet-500 hover:bg-violet-500/10 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(rule.id)}
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
              {rules.filter(r => r.category === cat).length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-slate-400 font-medium italic">No rules defined for this category.</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20 dark:border-white/5"
            >
              <div className="p-10 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-violet-500/10 text-violet-500 rounded-2xl">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">New Regulation</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Expand the policy framework</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category</label>
                  <select 
                    value={newRule.category}
                    onChange={e => setNewRule({...newRule, category: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
                  >
                    <option value="Hostel">Hostel</option>
                    <option value="Mess">Mess</option>
                    <option value="Payment">Payment</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Rule Content</label>
                  <textarea 
                    required
                    rows={5}
                    value={newRule.content}
                    onChange={e => setNewRule({...newRule, content: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all resize-none font-medium text-slate-700 dark:text-white"
                    placeholder="Type the rule here..."
                  />
                </div>
                <div className="flex justify-end gap-4 mt-10">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-8 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-10 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
                  >
                    Add Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20 dark:border-white/5 p-10 text-center"
            >
              <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Delete Policy?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">
                This action cannot be undone. This policy will be permanently removed from the system.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/25"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rules;

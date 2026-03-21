import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Plus, Edit2, Trash2, 
  CheckCircle, XCircle, AlertTriangle, 
  Info, X, Save, Building2, Utensils, 
  CreditCard
} from 'lucide-react';

const Rules: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({ category: 'Hostel', content: '' });

  const fetchRules = async () => {
    const res = await fetch('/api/rules');
    const data = await res.json();
    setRules(data);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingRule(null);
        fetchRules();
      }
    } catch (err) {
      alert('Error updating rule');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewRule({ category: 'Hostel', content: '' });
        fetchRules();
      }
    } catch (err) {
      alert('Error adding rule');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchRules();
    } catch (err) {
      alert('Error deleting rule');
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Hostel': return <Building2 size={20} className="text-blue-600" />;
      case 'Mess': return <Utensils size={20} className="text-emerald-600" />;
      case 'Payment': return <CreditCard size={20} className="text-orange-600" />;
      default: return <Info size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Terms & Rules Management</h2>
          <p className="text-gray-500">Define and update hostel policies and regulations.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} />
          Add New Rule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {['Hostel', 'Mess', 'Payment'].map((cat) => (
          <div key={cat} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
              {getIcon(cat)}
              <h3 className="text-lg font-bold text-gray-800">{cat} Rules</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {rules.filter(r => r.category === cat).map((rule) => (
                <div key={rule.id} className="p-6 flex items-start justify-between gap-6 group">
                  <div className="flex-1">
                    {editingRule === rule.id ? (
                      <div className="space-y-4">
                        <textarea 
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="w-full p-4 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdate(rule.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all"
                          >
                            <Save size={16} />
                            Save Changes
                          </button>
                          <button 
                            onClick={() => setEditingRule(null)}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <p className="text-gray-600 leading-relaxed">{rule.content}</p>
                      </div>
                    )}
                  </div>
                  {!editingRule && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingRule(rule.id); setEditContent(rule.content); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Add New Rule</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Category</label>
                <select 
                  value={newRule.category}
                  onChange={e => setNewRule({...newRule, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="Hostel">Hostel</option>
                  <option value="Mess">Mess</option>
                  <option value="Payment">Payment</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Rule Content</label>
                <textarea 
                  required
                  rows={4}
                  value={newRule.content}
                  onChange={e => setNewRule({...newRule, content: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  placeholder="Type the rule here..."
                />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rules;

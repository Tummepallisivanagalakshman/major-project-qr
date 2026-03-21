import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Filter, Plus, 
  CheckCircle, XCircle, Clock, 
  TrendingUp, TrendingDown, DollarSign,
  Download, FileText, X
} from 'lucide-react';

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
    const res = await fetch('/api/admin/payments');
    const data = await res.json();
    setPayments(data);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = React.useMemo(() => {
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
          setShowAddModal(false);
          fetchPayments();
          onUpdate();
        }
      } catch (err) {
        alert('Error adding payment');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Student ID</label>
            <input 
              required
              value={formData.student_id}
              onChange={e => setFormData({...formData, student_id: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. STU123"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Amount (₹)</label>
            <input 
              required
              type="number"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Payment Mode</label>
            <select 
              value={formData.mode}
              onChange={e => setFormData({...formData, mode: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Date</label>
            <input 
              required
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
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
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Recording...' : 'Add Payment Entry'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-gray-500 font-medium">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-3/4" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="text-gray-500 font-medium">Avg. Payment</h3>
              <p className="text-2xl font-bold text-gray-800">₹{(totalRevenue / (payments.length || 1)).toFixed(0)}</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-1/2" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-gray-500 font-medium">Pending Entries</h3>
              <p className="text-2xl font-bold text-gray-800">{payments.filter(p => p.status === 'Pending').length}</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-1/4" />
          </div>
        </div>
      </div>

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
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm outline-none font-medium text-gray-600"
          >
            <option value="All">All Status</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus size={20} />
            Manual Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-widest">
                <th className="px-8 py-5 font-bold">Student</th>
                <th className="px-8 py-5 font-bold">Amount</th>
                <th className="px-8 py-5 font-bold">Date & Mode</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{p.full_name}</span>
                      <span className="text-xs text-gray-400 font-mono tracking-tighter">{p.student_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-lg font-bold text-gray-800">₹{p.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-gray-700">{p.date}</div>
                      <div className="text-xs text-gray-400 font-bold uppercase">{p.mode}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                      p.status === 'Success' ? 'text-emerald-600' : 
                      p.status === 'Pending' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {p.status === 'Success' ? <CheckCircle size={14} /> : 
                       p.status === 'Pending' ? <Clock size={14} /> : <XCircle size={14} />}
                      {p.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Add Manual Payment</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="p-8">
              <PaymentForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PaymentManagement;

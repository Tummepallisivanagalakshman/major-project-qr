import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, 
  MoreVertical, Edit2, Trash2, UserCheck, 
  UserX, ChevronRight, X, Download,
  Mail, Phone, MapPin, Bed, Layers, Building2,
  CreditCard, ShieldCheck, Info
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface StudentManagementProps {
  students: any[];
  onUpdate: () => void;
}

const StudentManagement: React.FC<StudentManagementProps> = React.memo(({ students, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.student_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, filterStatus]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) onUpdate();
    } catch (err) {
      alert('Error deleting student');
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    try {
      const res = await fetch('/api/admin/students/block-unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) onUpdate();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const StudentForm = ({ student, isEdit }: { student?: any, isEdit?: boolean }) => {
    const [formData, setFormData] = useState(student || {
      username: '',
      password: '',
      student_id: '',
      full_name: '',
      email: '',
      phone: '',
      hostel_name: 'Main Hostel',
      block: 'A',
      room_number: '',
      room_type: 'Non-AC',
      sharing_type: 'Triple',
      total_fees: 50000,
      floor: '1st',
      bed_number: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const url = isEdit ? `/api/admin/students/${student.id}` : '/api/admin/students/add';
        const method = isEdit ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          setShowEditModal(false);
          onUpdate();
        } else {
          alert(data.message || 'Error saving student');
        }
      } catch (err) {
        alert('Error saving student');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Full Name</label>
            <input 
              required
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Student ID</label>
            <input 
              required
              disabled={isEdit}
              value={formData.student_id}
              onChange={e => setFormData({...formData, student_id: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="e.g. STU123"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email</label>
            <input 
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Phone</label>
            <input 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="+91 98765 43210"
            />
          </div>
          {!isEdit && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Username</label>
                <input 
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="john_doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Password</label>
                <input 
                  required
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Room Number</label>
            <input 
              required
              value={formData.room_number}
              onChange={e => setFormData({...formData, room_number: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. 101"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Room Type</label>
            <select 
              value={formData.room_type}
              onChange={e => setFormData({...formData, room_type: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="AC">AC</option>
              <option value="Non-AC">Non-AC</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button 
            type="button"
            onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Search by name or ID..."
          />
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm outline-none font-medium text-gray-600"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus size={20} />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-widest">
                <th className="px-8 py-5 font-bold">Student</th>
                <th className="px-8 py-5 font-bold">Room Details</th>
                <th className="px-8 py-5 font-bold">Payment</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {s.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{s.full_name}</h4>
                        <p className="text-sm text-gray-400 font-mono tracking-tighter">{s.student_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Building2 size={14} className="text-gray-400" />
                        Room {s.room_number}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Layers size={14} />
                        {s.room_type} • {s.sharing_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-gray-800">₹{s.paid_amount.toLocaleString()}</div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${Math.min(100, (s.paid_amount / s.total_fees) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">of ₹{s.total_fees.toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleToggleStatus(s.student_id, s.status)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                        s.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {s.status}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedStudent(s); setShowEditModal(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modals */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {showEditModal ? 'Edit Student Profile' : 'Register New Student'}
              </h2>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <StudentForm student={selectedStudent} isEdit={showEditModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default StudentManagement;

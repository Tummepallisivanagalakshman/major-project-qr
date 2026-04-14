import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, 
  MoreVertical, Edit2, Trash2, UserCheck, 
  UserX, ChevronRight, X, Download,
  Mail, Phone, MapPin, Bed, Layers, Building2,
  CreditCard, ShieldCheck, Info, Sparkles, Zap
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as api from '../../lib/api';

interface StudentManagementProps {
  students: any[];
  onUpdate: () => void;
}

const StudentForm = ({ 
  student, 
  isEdit, 
  onClose, 
  onUpdate, 
  isSubmitting, 
  setIsSubmitting 
}: { 
  student?: any, 
  isEdit?: boolean, 
  onClose: () => void, 
  onUpdate: () => void,
  isSubmitting: boolean,
  setIsSubmitting: (val: boolean) => void
}) => {
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
      if (isEdit) {
        await api.updateStudent(student.id, formData);
        toast.success('Student profile updated');
      } else {
        await api.signupUser(formData);
        toast.success('Student registered successfully');
      }
      onClose();
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Error saving student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
          <input 
            required
            value={formData.full_name}
            onChange={e => setFormData({...formData, full_name: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Student ID</label>
          <input 
            required
            disabled={isEdit}
            value={formData.student_id}
            onChange={e => setFormData({...formData, student_id: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all disabled:opacity-50 dark:text-white font-mono"
            placeholder="e.g. STU123"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <input 
            required
            type="email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
          <input 
            required
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="+91 98765 43210"
          />
        </div>
        {!isEdit && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <input 
                required
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
                placeholder="john_doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </>
        )}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Room Number</label>
          <input 
            required
            value={formData.room_number}
            onChange={e => setFormData({...formData, room_number: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="e.g. 101"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Room Type</label>
          <select 
            value={formData.room_type}
            onChange={e => setFormData({...formData, room_type: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white appearance-none"
          >
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Sharing Type</label>
          <select 
            value={formData.sharing_type}
            onChange={e => setFormData({...formData, sharing_type: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white appearance-none"
          >
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
            <option value="Four">Four Sharing</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Hostel Name</label>
          <input 
            required
            value={formData.hostel_name}
            onChange={e => setFormData({...formData, hostel_name: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="e.g. North Wing"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Block</label>
          <input 
            required
            value={formData.block}
            onChange={e => setFormData({...formData, block: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="e.g. B-Block"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Floor</label>
          <input 
            required
            value={formData.floor}
            onChange={e => setFormData({...formData, floor: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="e.g. 3rd Floor"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Bed Number</label>
          <input 
            required
            value={formData.bed_number}
            onChange={e => setFormData({...formData, bed_number: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="e.g. B1"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Total Fees (₹)</label>
          <input 
            required
            type="number"
            value={formData.total_fees}
            onChange={e => setFormData({...formData, total_fees: Number(e.target.value)})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
            placeholder="50000"
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <button 
          type="button"
          onClick={onClose}
          className="px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          Cancel
        </button>
        <button 
          disabled={isSubmitting}
          className="btn-primary px-10 py-4"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Profile' : 'Register Student'}
        </button>
      </div>
    </form>
  );
};

const StudentManagement: React.FC<StudentManagementProps> = React.memo(({ students, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddClick = () => {
    setSelectedStudent(null);
    setShowAddModal(true);
  };

  const handleEditClick = (student: any) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedStudent(null);
  };

  const filteredStudents = React.useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter(s => {
      const matchesSearch = (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (s.student_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, filterStatus]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const handleDelete = async (id: any) => {
    try {
      await api.deleteStudent(id);
      toast.success('Student deleted successfully');
      onUpdate();
      setShowDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting student');
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    try {
      await api.updateStudentStatus(studentId, newStatus);
      toast.success(`Student ${newStatus === 'Active' ? 'unblocked' : 'blocked'} successfully`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    }
  };


  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white text-sm"
            placeholder="Search by name or student ID..."
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="pl-10 pr-8 py-4 rounded-2xl border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm outline-none font-bold text-slate-600 dark:text-slate-400 text-sm appearance-none min-w-[160px]"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Blocked">Blocked Only</option>
            </select>
          </div>
          <button 
            onClick={handleAddClick}
            className="btn-primary flex items-center justify-center gap-2 px-8 py-4"
          >
            <Plus size={20} />
            Add New Student
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-6">Student Profile</th>
                <th className="px-8 py-6">Room Allocation</th>
                <th className="px-8 py-6">Fee Status</th>
                <th className="px-8 py-6">Account Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-200 dark:shadow-none">
                        {(s.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">{s.full_name || 'Unknown'}</h4>
                        <p className="text-xs text-slate-400 font-mono tracking-tighter truncate">{s.student_id || 'No ID'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <Building2 size={14} className="text-violet-500" />
                        Room {s.room_number}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                        <Layers size={14} />
                        {s.room_type} • {s.sharing_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white">₹{(s.paid_amount || 0).toLocaleString()}</span>
                        <span className="text-slate-400">₹{(s.total_fees || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((s.paid_amount || 0) / (s.total_fees || 1)) * 100)}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleToggleStatus(s.student_id, s.status)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        s.status === 'Active' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                      }`}
                    >
                      {s.status}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(s)}
                        className="p-2.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all"
                        title="Edit Student"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(s.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Delete Student"
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6 text-red-600">
                  <Trash2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Are you sure?</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                  This action will permanently delete the student record and free up their allocated bed. This cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 px-8 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modals */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20 dark:border-white/5"
            >
              <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {showEditModal ? 'Edit Profile' : 'New Registration'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage student information and room allocation</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8 sm:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <StudentForm 
                  student={selectedStudent} 
                  isEdit={showEditModal} 
                  onClose={closeModal}
                  onUpdate={onUpdate}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default StudentManagement;

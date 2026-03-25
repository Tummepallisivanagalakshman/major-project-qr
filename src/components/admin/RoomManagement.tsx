import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Edit2, Trash2, 
  DoorOpen, DoorClosed, Users, 
  Layers, Building2, CheckCircle, XCircle,
  AlertTriangle, Info, X, Sparkles, Zap, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface RoomManagementProps {
  onUpdate: () => void;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ onUpdate }) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : (data.success ? data.rooms : []));
    } catch (err) {
      toast.error('Failed to fetch rooms');
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Room deleted successfully');
        fetchRooms();
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      toast.error('Error deleting room');
    }
  };

  const RoomForm = ({ room, isEdit }: { room?: any, isEdit?: boolean }) => {
    const [formData, setFormData] = useState(room || {
      room_number: '',
      capacity: 2,
      type: 'AC',
      floor: '1st Floor',
      status: 'Available'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const url = isEdit ? `/api/rooms/${room.id}` : '/api/rooms';
        const method = isEdit ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(isEdit ? 'Room updated' : 'Room added');
          setShowAddModal(false);
          setShowEditModal(false);
          fetchRooms();
          onUpdate();
        } else {
          toast.error(data.message || 'Error saving room');
        }
      } catch (err) {
        toast.error('Error saving room');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Room Number</label>
            <input 
              required
              value={formData.room_number}
              onChange={e => setFormData({...formData, room_number: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
              placeholder="e.g. 101"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Capacity</label>
            <input 
              required
              type="number"
              min="1"
              max="10"
              value={formData.capacity}
              onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Room Type</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
            >
              <option value="AC">AC</option>
              <option value="Non-AC">Non-AC</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Floor</label>
            <select 
              value={formData.floor}
              onChange={e => setFormData({...formData, floor: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
            >
              <option value="1st Floor">1st Floor</option>
              <option value="2nd Floor">2nd Floor</option>
              <option value="3rd Floor">3rd Floor</option>
              <option value="4th Floor">4th Floor</option>
            </select>
          </div>
          {isEdit && (
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Status</label>
              <div className="grid grid-cols-3 gap-4">
                {['Available', 'Maintenance', 'Full'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, status})}
                    className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      formData.status === status 
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none' 
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-10">
          <button 
            type="button"
            onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
            className="px-8 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={isSubmitting}
            className="px-10 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Room' : 'Add Room'}
          </button>
        </div>
      </form>
    );
  };

  const RoomCard = ({ room }: { room: any }) => {
    const [roomStudents, setRoomStudents] = useState<any[]>([]);
    const [showStudents, setShowStudents] = useState(false);

    const fetchRoomStudents = async () => {
      if (room.occupancy > 0) {
        try {
          const res = await fetch(`/api/rooms/${room.room_number}/students`);
          const data = await res.json();
          setRoomStudents(Array.isArray(data) ? data : (data.success ? data.students : []));
        } catch (err) {
          toast.error('Failed to fetch occupants');
          setRoomStudents([]);
        }
      }
    };

    useEffect(() => {
      if (showStudents) fetchRoomStudents();
    }, [showStudents]);

    const occupancyPercent = (room.occupancy / room.capacity) * 100;

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl hover:shadow-violet-500/5 transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Home size={80} className="text-violet-500" />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${room.occupancy >= room.capacity ? 'bg-rose-500/10 text-rose-500' : 'bg-violet-500/10 text-violet-500'} group-hover:scale-110 transition-transform`}>
              <Home size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Room {room.room_number}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{room.floor}</p>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            <button 
              onClick={() => { setSelectedRoom(room); setShowEditModal(true); }}
              className="p-3 text-slate-400 hover:text-violet-500 hover:bg-violet-500/10 rounded-xl transition-all"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(room.id)}
              className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Occupancy</span>
              <span className={room.occupancy >= room.capacity ? 'text-rose-500' : 'text-slate-900 dark:text-white'}>
                {room.occupancy} / {room.capacity}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPercent}%` }}
                className={`h-full rounded-full transition-all ${
                  room.occupancy >= room.capacity ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                  room.occupancy > room.capacity / 2 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <Layers size={14} className="text-slate-400" />
              </div>
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{room.type}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                room.status === 'Available' ? 'bg-emerald-500' : 
                room.status === 'Full' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{room.status}</span>
            </div>
          </div>

          {room.occupancy > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setShowStudents(!showStudents)}
                className="flex items-center gap-2 text-[10px] font-black text-violet-500 hover:text-violet-600 uppercase tracking-widest transition-all group/btn"
              >
                <Users size={16} className="group-hover/btn:scale-110 transition-transform" />
                {showStudents ? 'Hide Occupants' : 'View Occupants'}
              </button>
              
              <AnimatePresence>
                {showStudents && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    {roomStudents.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white">{s.full_name}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{s.student_id}</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${s.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Zap className="text-violet-500" size={32} />
            Room Inventory
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage hostel rooms, capacity, and occupancy in real-time.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10"
        >
          <Plus size={20} />
          Add New Room
        </button>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </motion.div>

      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
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
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {showEditModal ? 'Edit Room' : 'New Room'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Configure room parameters</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <div className="p-10">
                <RoomForm room={selectedRoom} isEdit={showEditModal} />
              </div>
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
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Delete Room?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">
                This action cannot be undone. All room data will be permanently removed.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
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

export default RoomManagement;

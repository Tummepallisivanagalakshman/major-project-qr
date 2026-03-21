import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Edit2, Trash2, 
  DoorOpen, DoorClosed, Users, 
  Layers, Building2, CheckCircle, XCircle,
  AlertTriangle, Info, X
} from 'lucide-react';

interface RoomManagementProps {
  onUpdate: () => void;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ onUpdate }) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRooms = async () => {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    setRooms(data);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchRooms();
    } catch (err) {
      alert('Error deleting room');
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
          setShowAddModal(false);
          setShowEditModal(false);
          fetchRooms();
          onUpdate();
        } else {
          alert(data.message || 'Error saving room');
        }
      } catch (err) {
        alert('Error saving room');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Capacity</label>
            <input 
              required
              type="number"
              min="1"
              max="10"
              value={formData.capacity}
              onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Room Type</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="AC">AC</option>
              <option value="Non-AC">Non-AC</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Floor</label>
            <select 
              value={formData.floor}
              onChange={e => setFormData({...formData, floor: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="1st Floor">1st Floor</option>
              <option value="2nd Floor">2nd Floor</option>
              <option value="3rd Floor">3rd Floor</option>
              <option value="4th Floor">4th Floor</option>
            </select>
          </div>
          {isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Full">Full</option>
              </select>
            </div>
          )}
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
        const res = await fetch(`/api/rooms/${room.room_number}/students`);
        const data = await res.json();
        setRoomStudents(data);
      }
    };

    useEffect(() => {
      if (showStudents) fetchRoomStudents();
    }, [showStudents]);

    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${room.occupancy >= room.capacity ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <Home size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Room {room.room_number}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{room.floor}</p>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => { setSelectedRoom(room); setShowEditModal(true); }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => handleDelete(room.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Occupancy</span>
            <span className="font-bold text-gray-800">{room.occupancy} / {room.capacity}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                room.occupancy >= room.capacity ? 'bg-red-500' : 
                room.occupancy > room.capacity / 2 ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${(room.occupancy / room.capacity) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-600 uppercase">{room.type}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <div className={`w-2 h-2 rounded-full ${
                room.status === 'Available' ? 'bg-emerald-500' : 
                room.status === 'Full' ? 'bg-red-500' : 'bg-orange-500'
              }`} />
              <span className="text-xs font-bold text-gray-600 uppercase">{room.status}</span>
            </div>
          </div>

          {room.occupancy > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-50">
              <button 
                onClick={() => setShowStudents(!showStudents)}
                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Users size={14} />
                {showStudents ? 'Hide Occupants' : 'View Occupants'}
              </button>
              
              {showStudents && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {roomStudents.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{s.full_name}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{s.student_id}</span>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Room Inventory</h2>
          <p className="text-gray-500">Manage hostel rooms, capacity, and occupancy.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} />
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {showEditModal ? 'Edit Room Details' : 'Add New Room'}
              </h2>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="p-8">
              <RoomForm room={selectedRoom} isEdit={showEditModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;

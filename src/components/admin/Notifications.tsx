import React, { useState } from 'react';
import { 
  Bell, Send, AlertTriangle, 
  Info, CreditCard, X, 
  CheckCircle, MessageSquare
} from 'lucide-react';

const Notifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('admin');
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Announcement broadcasted successfully!');
        setTitle('');
        setMessage('');
      }
    } catch (err) {
      alert('Error broadcasting announcement');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications Management</h2>
          <p className="text-gray-500">Send announcements and alerts to all students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Send size={20} className="text-blue-600" />
            Create Announcement
          </h3>
          <form onSubmit={handleBroadcast} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Title</label>
              <input 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Hostel Maintenance"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Category</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'admin', label: 'Admin', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { id: 'payment', label: 'Payment', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      type === item.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-50 hover:border-gray-100'
                    }`}
                  >
                    <item.icon size={24} className={item.color} />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Message</label>
              <textarea 
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Type your announcement here..."
              />
            </div>
            <button 
              disabled={isSending}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isSending ? 'Broadcasting...' : 'Send to All Students'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-lg shadow-blue-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              Quick Templates
            </h3>
            <div className="space-y-4">
              {[
                { title: 'Payment Reminder', body: 'This is a gentle reminder to clear your hostel dues by the 15th.', type: 'payment' },
                { title: 'Water Supply Update', body: 'Water supply will be interrupted tomorrow from 10 AM to 2 PM.', type: 'admin' },
                { title: 'Emergency Drill', body: 'Fire safety drill scheduled for this evening at 5 PM.', type: 'emergency' }
              ].map((t, i) => (
                <button 
                  key={i}
                  onClick={() => { setTitle(t.title); setMessage(t.body); setType(t.type); }}
                  className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition-all border border-white/10"
                >
                  <h4 className="font-bold text-sm mb-1">{t.title}</h4>
                  <p className="text-xs text-white/60 line-clamp-1">{t.body}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Broadcasts</h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl h-fit">
                  <Info size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Maintenance Update</h4>
                  <p className="text-xs text-gray-500 mt-1">Sent to 124 students • 2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl h-fit">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Fee Reminder</h4>
                  <p className="text-xs text-gray-500 mt-1">Sent to 124 students • 1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

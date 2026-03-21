import React from 'react';
import { 
  Users, UserCheck, UserX, Home, 
  DoorOpen, DoorClosed, CreditCard, Clock,
  Utensils, Coffee, Sun, Moon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface OverviewProps {
  stats: any;
}

const Overview: React.FC<OverviewProps> = React.memo(({ stats }) => {
  const studentData = [
    { name: 'Active', value: stats.students?.active || 0, color: '#10B981' },
    { name: 'Blocked', value: stats.students?.blocked || 0, color: '#EF4444' },
  ];

  const roomData = [
    { name: 'Occupied', value: stats.rooms?.occupied || 0, color: '#3B82F6' },
    { name: 'Available', value: stats.rooms?.available || 0, color: '#10B981' },
  ];

  const mealData = [
    { name: 'Breakfast', count: stats.today_meals?.Breakfast || 0 },
    { name: 'Lunch', count: stats.today_meals?.Lunch || 0 },
    { name: 'Dinner', count: stats.today_meals?.Dinner || 0 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-800">{value}</span>
      </div>
      <h3 className="text-gray-500 font-medium">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.students?.total || 0} 
          icon={Users} 
          color="bg-blue-500"
          subtitle={`${stats.students?.active || 0} Active, ${stats.students?.blocked || 0} Blocked`}
        />
        <StatCard 
          title="Total Rooms" 
          value={stats.rooms?.total || 0} 
          icon={Home} 
          color="bg-indigo-500"
          subtitle={`${stats.rooms?.occupied || 0} Occupied, ${stats.rooms?.available || 0} Available`}
        />
        <StatCard 
          title="Revenue" 
          value={`₹${stats.payments?.total_received?.toLocaleString() || 0}`} 
          icon={CreditCard} 
          color="bg-emerald-500"
          subtitle={`₹${stats.payments?.pending?.toLocaleString() || 0} Pending`}
        />
        <StatCard 
          title="Today's Meals" 
          value={(stats.today_meals?.Breakfast || 0) + (stats.today_meals?.Lunch || 0) + (stats.today_meals?.Dinner || 0)} 
          icon={Utensils} 
          color="bg-orange-500"
          subtitle="Total scans today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Meal Distribution (Today)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Room Occupancy</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roomData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4 ml-8">
              {roomData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 font-medium">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Overview;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Utensils, 
  ArrowRight, CheckCircle, Clock, 
  Coffee, Sun, Moon, Phone, Mail, MapPin,
  QrCode, Zap, BarChart3, Sparkles, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MenuLogs from './MenuLogs';

const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'rules'>('menu');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const features = [
    {
      icon: <QrCode className="text-violet-600 dark:text-violet-400" size={24} />,
      title: "Smart QR Access",
      desc: "Instant meal verification with secure, dynamic QR codes generated for every student."
    },
    {
      icon: <BarChart3 className="text-emerald-600 dark:text-emerald-400" size={24} />,
      title: "Real-time Analytics",
      desc: "Comprehensive dashboards for admins to monitor meal distribution and student attendance."
    },
    {
      icon: <ShieldCheck className="text-blue-600 dark:text-blue-400" size={24} />,
      title: "Secure & Reliable",
      desc: "Built with enterprise-grade security to ensure data integrity and prevent unauthorized access."
    },
    {
      icon: <Zap className="text-amber-600 dark:text-amber-400" size={24} />,
      title: "Lightning Fast",
      desc: "Zero-lag interface designed for high-traffic mess environments and quick processing."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#020617] font-sans transition-colors duration-500 pro-grid">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-gray-100/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none group-hover:scale-110 transition-transform">
              <QrCode className="text-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              MEAL<span className="text-violet-600 dark:text-violet-400">PRO</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Features</a>
            <a href="#specifications" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Mess Info</a>
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Login
              </Link>
              <Link to="/signup" className="btn-primary text-sm px-6 py-2.5">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2 text-slate-600 dark:text-slate-400">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-900 dark:text-white">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-20 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-6 space-y-4 shadow-xl"
            >
              <a href="#features" className="block text-lg font-bold text-slate-900 dark:text-white" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#specifications" className="block text-lg font-bold text-slate-900 dark:text-white" onClick={() => setIsMenuOpen(false)}>Mess Info</a>
              <div className="pt-4 space-y-3">
                <Link to="/login" className="block w-full text-center py-3 font-bold text-slate-600 dark:text-slate-400" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="btn-primary w-full" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkles size={14} />
            The Future of Mess Management
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter mb-8"
          >
            Effortless <span className="text-gradient">Access</span> <br />
            <span className="serif-italic font-normal text-slate-400 dark:text-slate-500 lowercase">for every student.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A professional-grade QR-based meal verification system designed for modern hostels. 
            Secure, fast, and completely transparent management at your fingertips.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <Link to="/signup" className="w-full sm:w-auto btn-primary px-10 py-5 flex items-center justify-center gap-3 group text-lg">
              Get Started Now
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#specifications" className="w-full sm:w-auto btn-secondary px-10 py-5 text-lg">
              View Specifications
            </a>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900/50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-[#fcfcfd] dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover-lift"
              >
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section id="specifications" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Mess Information</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Stay updated with the daily menu and hostel regulations.</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button 
                onClick={() => setActiveTab('menu')}
                className={`px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'menu' 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Utensils size={18} /> Daily Menu
              </button>
              <button 
                onClick={() => setActiveTab('rules')}
                className={`px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'rules' 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <ShieldCheck size={18} /> Rules & Terms
              </button>
            </div>

            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="glass-card rounded-[2.5rem] p-6 sm:p-10"
            >
              {activeTab === 'menu' ? (
                <MenuLogs />
              ) : (
                <div className="space-y-12 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/50 dark:bg-slate-900/50 p-8 sm:p-10 rounded-[32px] border border-white/20 dark:border-white/5 shadow-sm">
                      <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-8">
                        <ShieldCheck size={28} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Hostel Rules</h3>
                      <ul className="space-y-5">
                        {[
                          'In-time for all students is 9:30 PM.',
                          'Silence hours: 10:00 PM to 6:00 AM.',
                          'No electrical appliances (heaters, stoves).',
                          'Prior permission required for late entry.'
                        ].map((rule, i) => (
                          <li key={i} className="flex items-start gap-4 text-slate-600 dark:text-slate-400">
                            <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                              <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-[15px] leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/50 dark:bg-slate-900/50 p-8 sm:p-10 rounded-[32px] border border-white/20 dark:border-white/5 shadow-sm">
                      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-8">
                        <Clock size={28} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Mess Timings</h3>
                      <ul className="space-y-5">
                        {[
                          { meal: 'Breakfast', time: '7:00 AM - 9:30 AM' },
                          { meal: 'Lunch', time: '12:30 PM - 2:30 PM' },
                          { meal: 'Snacks', time: '5:00 PM - 6:00 PM' },
                          { meal: 'Dinner', time: '7:30 PM - 9:30 PM' }
                        ].map((item, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{item.meal}</span>
                            <span className="text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-medium">{item.time}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-24 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-900/20">
                <QrCode size={28} />
              </div>
              <span className="text-2xl font-black tracking-tight uppercase">MEAL<span className="text-violet-400">PRO</span></span>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Providing a home away from home with smart technology and excellent facilities.
            </p>
          </div>
          <div className="space-y-8">
            <h4 className="text-xl font-bold">Contact Us</h4>
            <div className="space-y-6 text-slate-400">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Phone size={20} className="text-violet-500" />
                </div>
                <span className="text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Mail size={20} className="text-violet-500" />
                </div>
                <span className="text-sm">support@mealpro.com</span>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <h4 className="text-xl font-bold">Quick Links</h4>
            <div className="flex flex-col gap-4 text-slate-400">
              <Link to="/login" className="hover:text-violet-400 transition-colors text-sm">Student Login</Link>
              <Link to="/signup" className="hover:text-violet-400 transition-colors text-sm">New Registration</Link>
              <a href="#specifications" className="hover:text-violet-400 transition-colors text-sm">Mess Menu</a>
              <a href="#specifications" className="hover:text-violet-400 transition-colors text-sm">Hostel Rules</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
          <p>© 2026 MealPro Management System. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

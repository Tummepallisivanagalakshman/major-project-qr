import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Building2, ShieldCheck, Sparkles, AlertCircle, Lock, ArrowRight, Zap } from 'lucide-react';
import { loginUser } from '../lib/api';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await loginUser(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="pro-grid absolute inset-0 opacity-20 dark:opacity-10"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo & Branding */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-violet-500/20 mb-8 relative group"
          >
            <Building2 size={40} className="group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute -top-2 -right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg border-4 border-slate-50 dark:border-slate-950">
              <ShieldCheck size={16} />
            </div>
          </motion.div>
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Welcome Back
          </motion.h2>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 dark:text-slate-400 mt-3 font-medium italic"
          >
            Access your premium hostel management suite.
          </motion.p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={120} className="text-violet-500" />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="p-5 text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded-2xl flex items-center gap-4 border border-rose-500/20 overflow-hidden"
              >
                <div className="p-2 bg-rose-500/20 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <span className="font-bold">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Mail size={12} className="text-violet-500" />
                Network Identity (Email)
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Lock size={12} className="text-violet-500" />
                Security Access Key
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              {loading ? (
                <div className="w-6 h-6 border-4 border-current/30 border-t-current rounded-full animate-spin"></div>
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              New to the ecosystem?{' '}
              <Link to="/signup" className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1">
                Initialize Account
                <Zap size={10} />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center"
        >
          <Link to="/" className="text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2">
            <ArrowRight size={14} className="rotate-180" />
            Return to Terminal
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

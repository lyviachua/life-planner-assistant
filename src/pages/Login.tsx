import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setGuestMode } = useAuth();
  const navigate = useNavigate();

  const handleGuestMode = () => {
    setGuestMode(true);
    navigate('/');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Switching to Guest Mode...');
      setTimeout(handleGuestMode, 1500);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        alert('Registration successful! Check your email for verification.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message?.includes('Failed to fetch') || !window.navigator.onLine) {
        setError('Connection to auth server failed. Entering local Guest Mode...');
        setTimeout(handleGuestMode, 1500);
      } else {
        setError(err.message || 'Authentication error');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-500 text-slate-950 rounded-xl flex items-center justify-center mx-auto font-bold shadow-lg shadow-teal-500/20">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Life Planner Assistant</h1>
          <p className="text-xs text-slate-400">Sign in to access your synchronized productivity workspace.</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <FormField label="Full Name" required>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </FormField>
            )}

            <FormField label="Email Address" required>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </FormField>

            <Button type="submit" variant="primary" className="w-full" disabled={loading} icon={<ArrowRight size={16} />}>
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-slate-900 px-2 text-slate-500">Or skip auth</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-slate-800 hover:bg-slate-900 text-slate-300" 
              onClick={handleGuestMode}
              icon={<UserCheck size={16} />}
            >
              Continue in Guest Mode
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-teal-400 hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
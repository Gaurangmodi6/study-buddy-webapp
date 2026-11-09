import React, { useState } from 'react';
import { X, Rocket, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured, localStore } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name || email.split('@')[0],
              },
            },
          });
          if (error) throw error;
          if (data.user) {
            const profile: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              name: name || email.split('@')[0],
              streak_days: 5,
            };
            localStore.setUser(profile);
            onSuccess(profile);
            onClose();
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            const profile: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              name: data.user.user_metadata?.full_name || email.split('@')[0],
              streak_days: 5,
            };
            localStore.setUser(profile);
            onSuccess(profile);
            onClose();
          }
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const userId = 'usr_' + (email ? btoa(email).slice(0, 10).replace(/[^a-zA-Z0-9]/g, '') : 'commander');
        const profile: UserProfile = {
          id: userId,
          email: email || 'commander@studybuddy.space',
          name: name || (email ? email.split('@')[0] : 'Flight Commander'),
          streak_days: 5,
        };
        localStore.setUser(profile);
        onSuccess(profile);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication trajectory failed. Please check credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLaunch = () => {
    const demoUser: UserProfile = {
      id: 'demo-commander',
      email: 'alex.commander@orbit.edu',
      name: 'Alex Vance (Commander)',
      streak_days: 7,
    };
    localStore.setUser(demoUser);
    onSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl border border-[#38bdf8]/40 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/60 hover:text-[#38bdf8] hover:bg-[#0c1a38] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] mx-auto flex items-center justify-center text-white shadow-lg shadow-[#38bdf8]/30">
            <Rocket className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="font-bebas text-3xl sm:text-4xl text-white font-extrabold tracking-wide">
            {mode === 'signup' ? 'INITIATE FLIGHT CREDENTIALS' : 'COMMANDER LOG IN'}
          </h2>
          <p className="text-xs text-white/70 font-medium">
            {mode === 'signup'
              ? 'Register your mission credentials to begin flight tracking.'
              : 'Enter your credentials to regain mission control telemetry.'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
                Commander Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
              Academic Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="commander@university.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#38bdf8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
              Security Key (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#38bdf8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={(e) => triggerStrongButtonBurst(e, true)}
            className="blue-gradient-btn w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2 mt-2 shadow-lg shadow-[#38bdf8]/30"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Ignite & Launch' : 'Enter Mission Control'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#38bdf8]/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#040816] px-3 text-white/50 font-mono font-bold">OR</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoLaunch}
          className="w-full py-2.5 px-4 rounded-xl border border-[#38bdf8]/35 bg-[#060c1d] hover:bg-[#0c1a38] text-[#38bdf8] text-xs font-bold tracking-wider uppercase flex items-center justify-center space-x-2 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
          <span>Launch Demo Flight (Pre-loaded Missions)</span>
        </button>

        <div className="text-center mt-5 text-xs text-white/75">
          {mode === 'signup' ? (
            <p>
              Already hold flight credentials?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#38bdf8] font-bold hover:underline"
              >
                Log In
              </button>
            </p>
          ) : (
            <p>
              New cadet ready for launch?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[#38bdf8] font-bold hover:underline"
              >
                Create Credentials
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

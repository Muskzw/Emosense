import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, UserPlus, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="lob-card" style={{ maxWidth: '380px' }}>
        <div className="lob-card-hdr" style={{ textAlign: 'center', display: 'block' }}>
          <div className="lob-mark" style={{ margin: '0 auto 16px' }}>
            <LogIn size={20} color="var(--green)" />
          </div>
          <h1 className="lob-title" style={{ fontSize: '22px' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="lob-sub" style={{ marginTop: '4px' }}>
            {isSignUp ? 'Join EmoSense for professional insights' : 'Sign in to continue your sessions'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="lob-fields">
          <div className="fl">
            <label className="fl-l">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="fi" 
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            </div>
          </div>

          <div className="fl">
            <label className="fl-l">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="fi" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: '8px', color: 'var(--red)', fontSize: '12px', background: 'rgba(255,59,48,0.1)', padding: '10px', borderRadius: '8px', border: '0.5px solid rgba(255,59,48,0.2)' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div style={{ display: 'flex', gap: '8px', color: 'var(--green)', fontSize: '12px', background: 'var(--gd)', padding: '10px', borderRadius: '8px', border: '0.5px solid var(--gb)' }}>
              <span>{message}</span>
            </div>
          )}

          <button type="submit" className="btn-start" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />
            )}
            <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

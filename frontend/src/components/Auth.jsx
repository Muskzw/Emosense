import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, UserPlus, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// ── InputRow is defined OUTSIDE Auth so React never remounts inputs on re-render ──
function InputRow({ label, icon: Icon, type, value, onChange, placeholder, required, disabled }) {
  return (
    <div className="fl">
      <label className="fl-l">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          className="fi"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
          style={{ paddingLeft: '40px' }}
        />
        <Icon
          size={15}
          style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      if (isSignUp) {
        if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              display_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;
        setMessage('Account created! Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      <div className="lob-card" style={{ maxWidth: '400px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div className="lob-mark" style={{ margin: '0 auto 16px', width: '48px', height: '48px' }}>
            {isSignUp ? <UserPlus size={22} color="var(--green)" /> : <LogIn size={22} color="var(--green)" />}
          </div>
          <h1 className="lob-title" style={{ fontSize: '22px' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="lob-sub" style={{ marginTop: '6px' }}>
            {isSignUp ? 'Sign up to start using EmoSense' : 'Sign in to continue your sessions'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="lob-fields" style={{ marginTop: '8px' }}>
          {isSignUp && (
            <InputRow
              label="Full Name"
              icon={User}
              type="text"
              placeholder="e.g. Tinashe Moyo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          )}
          <InputRow
            label="Email Address"
            icon={Mail}
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <InputRow
            label="Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', gap: '8px', color: 'var(--red)', fontSize: '12px', background: 'rgba(255,59,48,0.08)', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid rgba(255,59,48,0.2)', alignItems: 'flex-start' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {message && (
            <div style={{ display: 'flex', gap: '8px', color: 'var(--green)', fontSize: '12px', background: 'var(--gd)', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid var(--gb)', alignItems: 'flex-start' }}>
              <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{message}</span>
            </div>
          )}

          <button type="submit" className="btn-start" disabled={loading} style={{ marginTop: '4px' }}>
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />
            }
            <span>{loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '13px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, UserPlus, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2, Building2, Briefcase, MapPin } from 'lucide-react';

const InputRow = ({ label, icon: Icon, type, value, onChange, placeholder, required, options, disabled }) => (
  <div className="fl">
    <label className="fl-l">{label}</label>
    <div style={{ position: 'relative' }}>
      {type === 'select' ? (
        <select className="fi" value={value} onChange={onChange} disabled={disabled} style={{ paddingLeft: '40px' }}>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className="fi"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          style={{ paddingLeft: '40px' }}
        />
      )}
      <Icon size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
    </div>
  </div>
);

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [org, setOrg] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Zimbabwe');
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
              organization: org.trim(),
              role: role.trim(),
              location: location,
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
    <div className="screen active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div className="lob-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90svh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div className="lob-mark" style={{ margin: '0 auto 16px', width: '48px', height: '48px' }}>
            {isSignUp ? <UserPlus size={22} color="var(--green)" /> : <LogIn size={22} color="var(--green)" />}
          </div>
          <h1 className="lob-title" style={{ fontSize: '22px' }}>
            {isSignUp ? 'Create Professional Profile' : 'Welcome Back'}
          </h1>
          <p className="lob-sub" style={{ marginTop: '6px' }}>
            {isSignUp ? 'Join the EmoSense cross-cultural network' : 'Sign in to continue your sessions'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="lob-fields" style={{ marginTop: '16px' }}>
          {isSignUp && (
            <>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InputRow
                  label="Organization"
                  icon={Building2}
                  type="text"
                  placeholder="Company name"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  disabled={loading}
                />
                <InputRow
                  label="Role"
                  icon={Briefcase}
                  type="text"
                  placeholder="e.g. Director"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                />
              </div>
              <InputRow
                label="Primary Location"
                icon={MapPin}
                type="select"
                options={['Zimbabwe', 'China', 'Other']}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </>
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

          <button type="submit" className="btn-start" disabled={loading} style={{ marginTop: '8px' }}>
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />
            }
            <span>{loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', paddingTop: '12px' }}>
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

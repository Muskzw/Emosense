import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useLang, LangSwitcher } from '../context/LangContext';
import { LogIn, UserPlus, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2, Building2, Briefcase, MapPin } from 'lucide-react';

const InputRow = ({ label, icon: Icon, type, value, onChange, placeholder, required, options, disabled }) => (
  <div className="fl">
    <label className="fl-l">{label}</label>
    <div style={{ position: 'relative' }}>
      {type === 'select' ? (
        <select className="fi" value={value} onChange={onChange} disabled={disabled} style={{ paddingLeft: '40px' }}>
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function Auth() {
  const { lang, t } = useLang();
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
        if (!fullName.trim()) { 
          setError(lang === 'zh' ? '请输入您的姓名。' : (lang === 'sn' ? 'Nyorai zita renyu rizere ndapota.' : 'Please enter your full name.')); 
          setLoading(false); 
          return; 
        }
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
        setMessage(lang === 'zh' ? '账户已创建！请检查您的邮箱以获取确认链接。' : (lang === 'sn' ? 'Account yakagadzirwa! Tarisa email yako kuti uwane link yekusimbisa.' : 'Account created! Check your email for a confirmation link.'));
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Supabase redirects back here
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="screen active" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #0f111a 0%, #050608 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      height: '100dvh',
      boxSizing: 'border-box'
    }}>
      {/* Premium Ambient Background Effects */}
      {/* 1. Neon Grid Lines Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '45px 45px',
        backgroundPosition: 'center',
        opacity: 0.85,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* 2. Floating Cyan/Blue Ambient Orb */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-15%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 122, 255, 0.18) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'pulseOrb1 15s infinite alternate ease-in-out',
      }} />

      {/* 3. Floating Emerald/Green Ambient Orb */}
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-15%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(61, 255, 160, 0.14) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'pulseOrb2 20s infinite alternate ease-in-out',
      }} />

      {/* 4. Ambient backlight glow directly behind card */}
      <div style={{
        position: 'absolute',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
        filter: 'blur(120px)',
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'cardGlow 10s infinite alternate ease-in-out',
      }} />

      {/* Dynamic Keyframes Styling */}
      <style>{`
        @keyframes pulseOrb1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          100% { transform: translate(100px, 50px) scale(1.2); opacity: 1; }
        }
        @keyframes pulseOrb2 {
          0% { transform: translate(0, 0) scale(1.15); opacity: 0.7; }
          100% { transform: translate(-80px, -50px) scale(0.9); opacity: 0.95; }
        }
        @keyframes cardGlow {
          0% { transform: scale(0.9) translate(-50%, -50%); opacity: 0.6; }
          100% { transform: scale(1.1) translate(-50%, -50%); opacity: 1; }
        }
      `}</style>

      {/* Glassmorphic Login/Registration Card */}
      <div className="lob-card" style={{
        position: 'relative',
        maxWidth: '440px',
        width: '100%',
        maxHeight: '90svh',
        overflowY: 'auto',
        zIndex: 5,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}>
        
        {/* Floating Language Switcher */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <LangSwitcher />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', paddingRight: '60px', paddingLeft: '60px' }}>
          <div className="lob-mark" style={{ margin: '0 auto 16px', width: '48px', height: '48px' }}>
            {isSignUp ? <UserPlus size={22} color="var(--green)" /> : <LogIn size={22} color="var(--green)" />}
          </div>
          <h1 className="lob-title" style={{ fontSize: '22px' }}>
            {isSignUp ? t('authCreateProfile') : t('authWelcome')}
          </h1>
          <p className="lob-sub" style={{ marginTop: '6px' }}>
            {isSignUp ? t('authCreateProfileSub') : t('authWelcomeSub')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="lob-fields" style={{ marginTop: '16px' }}>
          {isSignUp && (
            <>
              <InputRow
                label={t('fullName')}
                icon={User}
                type="text"
                placeholder={t('namePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InputRow
                  label={t('organization')}
                  icon={Building2}
                  type="text"
                  placeholder={t('orgPlaceholder')}
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  disabled={loading}
                />
                <InputRow
                  label={t('role')}
                  icon={Briefcase}
                  type="text"
                  placeholder={t('rolePlaceholder')}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                />
              </div>
              <InputRow
                label={t('location')}
                icon={MapPin}
                type="select"
                options={[
                  { value: 'Zimbabwe', label: lang === 'zh' ? '津巴布韦' : 'Zimbabwe' },
                  { value: 'China', label: lang === 'zh' ? '中国' : 'China' },
                  { value: 'Other', label: lang === 'zh' ? '其他' : (lang === 'sn' ? 'Zvimwe' : 'Other') }
                ]}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </>
          )}
          
          <InputRow
            label={t('email')}
            icon={Mail}
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <InputRow
            label={t('password')}
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
            <span>{loading ? t('pleaseWait') : isSignUp ? t('createAccount') : t('signIn')}</span>
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', opacity: 0.5 }}></div>
          <span style={{ margin: '0 12px', fontSize: '13px', color: 'var(--text-dim)', fontWeight: '500' }}>{t('or')}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', opacity: 0.5 }}></div>
        </div>

        {/* Google OAuth Button */}
        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px', 
            background: 'var(--b2)', 
            border: '1px solid var(--border)', 
            padding: '12px', 
            borderRadius: '12px', 
            color: 'var(--text)', 
            fontSize: '14px', 
            fontWeight: '500', 
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = 'var(--b3)' }}
          onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = 'var(--b2)' }}
        >
          <GoogleIcon />
          {t('continueGoogle')}
        </button>

        {/* Toggle */}
        <div style={{ textAlign: 'center', paddingTop: '20px' }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '13px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}
          >
            {isSignUp ? t('haveAccount') : t('noAccount')}
          </button>
        </div>

      </div>
    </div>
  );
}

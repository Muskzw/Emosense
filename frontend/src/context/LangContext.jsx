import React, { createContext, useContext, useState } from 'react';
import { t, LANGUAGES } from '../i18n';

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('emosense_lang') || 'en'
  );

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('emosense_lang', code);
  };

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang, t: (key) => t(lang, key) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function LangSwitcher({ style }) {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: 'flex', gap: '4px', ...style }}>
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          style={{
            padding: '4px 8px', borderRadius: '8px', border: '0.5px solid',
            borderColor: lang === l.code ? 'var(--gb)' : 'var(--bd2)',
            background: lang === l.code ? 'var(--gd)' : 'transparent',
            color: lang === l.code ? 'var(--green)' : 'var(--muted)',
            fontSize: '13px', cursor: 'pointer', transition: 'all .2s',
            lineHeight: 1,
          }}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}

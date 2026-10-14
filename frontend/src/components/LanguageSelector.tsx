import React from 'react';
import { Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Language } from '../i18n/translations';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useApp();

  return (
    <div className="flex items-center space-x-1 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 text-xs">
      <Globe className="w-3.5 h-3.5 text-blue-400 ml-1.5 mr-0.5 shrink-0" />
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Switch interface language to English"
      >
        English
      </button>
      <button
        onClick={() => setLanguage('ta')}
        className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
          language === 'ta'
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-400 hover:text-white'
        }`}
        title="மொழியை தமிழாக மாற்றுங்கள்"
      >
        தமிழ்
      </button>
    </div>
  );
};

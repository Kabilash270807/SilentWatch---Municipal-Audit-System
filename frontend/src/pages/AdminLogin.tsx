import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, isAdminAuthenticated, currentAdmin, logoutAdmin, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Target path where user was trying to go before redirect
  const from = (location.state as any)?.from?.pathname || '/admin/incidents';

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage(t('invalidCredentialsError'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: usernameOrEmail.trim(),
          password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || t('invalidCredentialsError'));
      }

      loginAdmin(data.token, data.user, data.expires_at);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || t('invalidCredentialsError'));
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated
  if (isAdminAuthenticated && currentAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('activeAdminSession')}</h2>
        <p className="text-xs text-slate-500">
          <strong>{currentAdmin.full_name}</strong> ({currentAdmin.email})
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate('/admin/incidents')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>{t('proceedToReports')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => logoutAdmin()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{t('adminLoginTitle')}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('adminLoginSubtitle')}
          </p>
        </div>

        {/* Policy Notice: Public Citizen Exemption */}
        <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 border-b border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 flex items-start space-x-2">
          <span className="font-bold shrink-0">{t('citizenNoticeTitle')}</span>
          <span>{t('citizenNoticeDesc')}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('adminUsernameLabel')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. admin or teamqudex@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('adminPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? t('verifyingCredentials') : t('adminSubmitBtn')}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-center text-[11px] text-slate-400">
            <span>{t('officialProvisionNotice')}</span>
          </div>
        </form>
      </div>
    </div>
  );
};

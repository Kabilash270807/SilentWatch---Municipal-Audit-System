import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  FileSpreadsheet,
  Sliders,
  Settings,
  Radio,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Menu,
  X,
  Volume2,
  Lock,
  LogOut,
  UserCheck,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LanguageSelector } from './LanguageSelector';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    dataSource,
    setDataSource,
    isOnline,
    pendingSyncCount,
    isAdminAuthenticated,
    currentAdmin,
    logoutAdmin,
    t
  } = useApp();

  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 1. PUBLIC CITIZEN NAVIGATION (No account or login required)
  const publicNavLinks = [
    { to: '/', label: t('navDashboard'), icon: BarChart3 },
    { to: '/monitor', label: t('navLiveMonitor'), icon: Radio },
    { to: '/classification', label: t('navSoundClassification'), icon: Activity },
    { to: '/heatmap', label: t('navHeatmap'), icon: MapPin },
    { to: '/calibration', label: t('navCalibration'), icon: Sliders },
    { to: '/privacy', label: t('navPrivacy'), icon: ShieldCheck },
  ];

  // 2. RESTRICTED MUNICIPAL ADMINISTRATOR NAVIGATION (Only after authentication)
  const adminNavLinks = [
    { to: '/admin/incidents', label: t('navIncidents'), icon: AlertTriangle },
    { to: '/admin/night-screening', label: t('navNightScreening'), icon: FileSpreadsheet },
    { to: '/admin/audit-reports', label: t('navAuditReports'), icon: FileText },
  ];

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center space-x-1.5">
                <span>{t('appTitle')}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-900/80 border border-blue-500/40 text-blue-300 font-mono">
                  {t('versionBadge')}
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block leading-tight">{t('appSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Global Controls & Language Selector */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Language Selector component (English / தமிழ்) */}
          <LanguageSelector />

          {/* Data Source Badge (Desktop) */}
          <div className="hidden xl:flex items-center space-x-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">{t('dataSource')}:</span>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as any)}
              className="bg-transparent text-blue-400 font-medium focus:outline-none cursor-pointer"
            >
              <option value="REAL_MIC" className="bg-slate-900 text-emerald-400">{t('sourceLiveMic')}</option>
              <option value="LOCAL_STORED" className="bg-slate-900 text-blue-400">{t('sourceLocalStored')}</option>
              <option value="BACKEND" className="bg-slate-900 text-purple-400">{t('sourceBackend')}</option>
              <option value="DEMO_DATA" className="bg-slate-900 text-amber-400">{t('sourceDemo')}</option>
            </select>
          </div>

          {/* Online/Offline Status */}
          <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-lg bg-slate-800 border border-slate-700">
            {isOnline ? (
              <span className="flex items-center text-emerald-400 space-x-1">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('online')}</span>
              </span>
            ) : (
              <span className="flex items-center text-amber-400 space-x-1">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('offline')}</span>
              </span>
            )}
          </div>

          {pendingSyncCount > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
              {pendingSyncCount} {t('pending')}
            </span>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title={t('toggleTheme')}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Admin Login / Session Status in Header */}
          {isAdminAuthenticated && currentAdmin ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight">{currentAdmin.full_name}</span>
                <span className="text-[10px] text-blue-400 font-mono">{t('municipalAdmin')}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                title={t('logoutAdmin')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          ) : (
            <NavLink
              to="/admin/login"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('adminLogin')}</span>
            </NavLink>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
          <nav className="p-3 space-y-4 overflow-y-auto flex-1">
            {/* Public Section */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-1">
                {t('publicCitizenNav')}
              </span>
              <div className="space-y-0.5">
                {publicNavLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Restricted Section */}
            {isAdminAuthenticated ? (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 block mb-1 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>{t('municipalAdminNav')}</span>
                </span>
                <div className="space-y-0.5">
                  {adminNavLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30 font-semibold'
                            : 'text-amber-200/80 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{t('logoutAdmin')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-1">
                  {t('officersOnly')}
                </span>
                <NavLink
                  to="/admin/login"
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <Lock className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{t('adminLogin')}</span>
                </NavLink>
              </div>
            )}
          </nav>

          {/* Privacy Safeguard Callout */}
          <div className="p-3 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('zeroCitizenTitle')}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t('zeroCitizenDesc')}
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex">
            <div className="w-64 bg-slate-900 text-white p-4 flex flex-col h-full shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-2">
                <span className="font-bold text-base">{t('appTitle')}</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-4 flex-1 overflow-y-auto">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 px-3 block mb-1">
                    {t('publicCitizenNav')}
                  </span>
                  <div className="space-y-1">
                    {publicNavLinks.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium ${
                            isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>

                {isAdminAuthenticated ? (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-amber-400 px-3 block mb-1">
                      {t('municipalAdminNav')}
                    </span>
                    <div className="space-y-1">
                      {adminNavLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium ${
                              isActive ? 'bg-amber-600 text-white' : 'text-amber-200/80 hover:bg-slate-800'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-slate-800 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800">
                    <NavLink
                      to="/admin/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-blue-400 hover:bg-slate-800"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{t('adminLogin')}</span>
                    </NavLink>
                  </div>
                )}
              </nav>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Page Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {dataSource === 'DEMO_DATA' && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-200">
                  {t('demoModeActive')}
                </span>
                <span>{t('demoModeDesc')}</span>
              </div>
              <button
                onClick={() => setDataSource('REAL_MIC')}
                className="font-medium underline hover:text-amber-900 dark:hover:text-amber-100"
              >
                {t('switchToLive')}
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};

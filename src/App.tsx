import React, { useState, useEffect } from 'react';
import { 
  Grid, Users, Coins, Receipt, FileText, PieChart, Sliders, LogOut, Moon, Sun, Menu, X, User as UserIcon,
  Database, Download, CheckCircle2
} from 'lucide-react';
import { User, UserRole } from './types';
import { DB } from './db/storage';

// Import modular panels
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LearnerManagement from './components/LearnerManagement';
import FeeManagement from './components/FeeManagement';
import ReceiptsManagement from './components/Receipts';
import FeeStatements from './components/Statements';
import Reports from './components/Reports';
import Settings from './components/Settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeStatementLearnerId, setActiveStatementLearnerId] = useState('');
  
  // Responsive sidebar toggles for mobile view
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Automated daily database backup notification state
  const [backupNotification, setBackupNotification] = useState<{ show: boolean; date: string; downloadData: string } | null>(null);

  // Dark/Light theme mode state manager
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('bk_dark_mode');
    return saved === 'true';
  });

  // Check login session on load
  useEffect(() => {
    const sessionUser = DB.getCurrentUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
      // Trigger background sync from MySQL server
      DB.syncWithServer().catch(console.error);
    }
  }, []);

  // Automated monthly database backup process (runs automatically on the 7th of every month)
  useEffect(() => {
    if (currentUser && (currentUser.role === 'Administrator' || currentUser.role === 'Principal')) {
      const today = new Date();
      const is7th = today.getDate() === 7;
      
      if (is7th) {
        const monthYearStr = `${today.getFullYear()}-${today.getMonth() + 1}`;
        const lastBackupMonth = localStorage.getItem('bk_last_backup_month');
        
        if (lastBackupMonth !== monthYearStr) {
          try {
            // Perform automatic snapshot backup of all active fee and student ledgers
            const backupJson = DB.backupDatabase();
            
            // Persistence: Store the backup and metadata in localStorage
            localStorage.setItem('bk_last_backup_month', monthYearStr);
            localStorage.setItem('bk_latest_auto_backup_json', backupJson);
            
            // Log inside the secure Audit Trails Log
            DB.log(
              'Automated Monthly Backup',
              'System automatically performed a successful monthly snapshot backup of all registered learners, parent details, outstanding fee balances, payments, and receipt ledgers on the 7th of the month.'
            );
            
            // Trigger in-app successful alert banner
            setBackupNotification({
              show: true,
              date: today.toISOString().split('T')[0],
              downloadData: backupJson
            });
          } catch (err) {
            console.error('Failed to trigger monthly database backup snapshot:', err);
          }
        }
      }
    }
  }, [currentUser]);

  // Update theme classes on document
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('bk_dark_mode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('bk_dark_mode', 'false');
    }
  }, [darkMode]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    DB.log('User Logout', `User ${currentUser?.username} logged out from secure session.`);
    DB.setCurrentUser(null);
    setCurrentUser(null);
    setSidebarOpen(false);
  };

  const handleRefreshSession = () => {
    // If database restore occurred, make sure system does not crash or gets updated
    const session = DB.getCurrentUser();
    if (session) {
      setCurrentUser(session);
    } else {
      setCurrentUser(null);
    }
  };

  const navigateToView = (view: string, targetId?: string) => {
    setActiveTab(view);
    if (view === 'statements' && targetId) {
      setActiveStatementLearnerId(targetId);
    } else {
      setActiveStatementLearnerId('');
    }
    setSidebarOpen(false); // Close responsive drawers
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden leading-tight font-sans">
      
      {/* 1. SIDE NAVIGATION BAR (DESKTOP & RESPONSIVE DRAWER) */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-68 flex-col border-r border-slate-205 dark:border-slate-800 bg-brand-blue text-white transition-transform md:translate-x-0 cursor-pointer select-none no-print ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:relative md:flex'}`}>
        
        {/* SIDEBAR LOGO MARGIN */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <svg className="h-5.5 w-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0a5 5 0 00-5 5v3a5 5 0 005-5zm0 0a5 5 0 015 5v3a5 5 0 01-5-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none">Blooming Kids</h1>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-red">ECD Learning Centre</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-white hover:bg-white/15 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PROFILE CARD AT SIDEBAR TOP */}
        <div className="p-4 mx-4 my-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand-red flex items-center justify-center text-white font-extrabold select-none shadow">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black truncate">{currentUser.name}</h4>
            <span className="text-[9px] font-semibold text-white/70 uppercase block truncate mt-0.5">{currentUser.role}</span>
          </div>
        </div>

        {/* NAVIGATION LINKS CONTAINER */}
        <nav className="flex-1 space-y-1.5 px-4 py-3 overflow-y-auto">
          
          <button
            onClick={() => navigateToView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition hover:bg-white/10 ${activeTab === 'dashboard' ? 'bg-white/15 text-white border-l-4 border-brand-red' : 'text-white/80'}`}
          >
            <Grid className="h-4.5 w-4.5" />
            Dashboard Welcome
          </button>

          <button
            onClick={() => navigateToView('learners')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition hover:bg-white/10 ${activeTab === 'learners' ? 'bg-white/15 text-white border-l-4 border-brand-red' : 'text-white/80'}`}
          >
            <Users className="h-4.5 w-4.5" />
            Learners Register
          </button>

          <button
            onClick={() => navigateToView('fees')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition hover:bg-white/10 ${activeTab === 'fees' ? 'bg-white/15 text-white border-l-4 border-brand-red' : 'text-white/80'}`}
          >
            <Coins className="h-4.5 w-4.5" />
            Bursary & Payments
          </button>

          <button
            onClick={() => navigateToView('receipts')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition hover:bg-white/10 ${activeTab === 'receipts' ? 'bg-white/15 text-white border-l-4 border-brand-red' : 'text-white/80'}`}
          >
            <Receipt className="h-4.5 w-4.5" />
            Payment Receipts
          </button>

          <button
            onClick={() => navigateToView('statements')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition hover:bg-white/10 ${activeTab === 'statements' ? 'bg-white/15 text-white border-l-4 border-brand-red' : 'text-white/80'}`}
          >
            <FileText className="h-4.5 w-4.5" />
            A4 Fee Statements
          </button>

          <button
            onClick={() => navigateToView('reports')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition hover:bg-white/10 ${activeTab === 'reports' ? 'bg-white/15 text-white border-l-4 border-brand-red' : 'text-white/80'}`}
          >
            <PieChart className="h-4.5 w-4.5" />
            Audits & Reports
          </button>

          <button
            onClick={() => navigateToView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition hover:bg-white/10 ${activeTab === 'settings' ? 'bg-white/15 text-white border-l-4 border-brand-red' : 'text-white/80'}`}
          >
            <Sliders className="h-4.5 w-4.5" />
            General Setup
          </button>

        </nav>

        {/* LOGOUT FOOTER ACTION */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 hover:bg-brand-red/90 hover:border-transparent text-white px-4 py-2.5 text-xs font-extrabold transition cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Secure Logout
          </button>
        </div>

      </aside>

      {/* 2. MAIN APP CONTAINER (HEADER + MAIN TAB ROUTING SCREEN) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* HEADER SECTION (no-print tag) */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white px-6 shrink-0 dark:bg-slate-900 no-print select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Header branding title */}
            <span className="text-xs uppercase bg-brand-red/10 text-brand-red font-black px-2.5 py-1 rounded">
              Secure Bursar Link
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* LIGHT AND DARK THEME TOGGLE (PROMPT: "dark and light mode") */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 transition cursor-pointer"
              title="Toggle Color Theme"
            >
              {darkMode ? (
                <Sun className="h-5.5 w-5.5 text-amber-500" />
              ) : (
                <Moon className="h-5.5 w-5.5 text-slate-600" />
              )}
            </button>

            {/* QUICK USER STATUS TEXT DISPLAY */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Encrypted</span>
            </div>

          </div>
        </header>

        {/* CHOSEN TAB ROUTER WRAPPER */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          
          <div className="mx-auto max-w-7xl">
            {backupNotification && backupNotification.show && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/35 border-l-4 border-emerald-500 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in no-print">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-emerald-400 uppercase tracking-wide">Monthly Automated Database Backup Success</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-normal">
                      A complete encrypted snapshot of all active fee structures, registered learners, payments, and parent registries has been compiled automatically today (7th of the month, {backupNotification.date}). Keep a copy for emergency offsite recoveries.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={() => {
                      const dataStr = backupNotification.downloadData;
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute('href', dataUri);
                      downloadAnchor.setAttribute('download', `BloomingKids_AutoBackup_${backupNotification.date}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      DB.log('Download AutoBackup', 'Admin downloaded a direct copy of the monthly automated backup file.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded shadow-xs uppercase select-none transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Snapshot (.json)
                  </button>
                  <button
                    onClick={() => setBackupNotification(null)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-extrabold text-[10px] rounded uppercase select-none transition cursor-pointer"
                  >
                    Dismiss Notice
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <Dashboard 
                onNavigate={navigateToView} 
                currentUserRole={currentUser.role}
              />
            )}
            {activeTab === 'learners' && (
              <LearnerManagement 
                currentUserRole={currentUser.role}
              />
            )}
            {activeTab === 'fees' && (
              <FeeManagement 
                onNavigate={navigateToView} 
                currentUserRole={currentUser.role}
              />
            )}
            {activeTab === 'receipts' && (
              <ReceiptsManagement />
            )}
            {activeTab === 'statements' && (
              <FeeStatements 
                activeLearnerId={activeStatementLearnerId}
                onBackToDashboard={() => navigateToView('dashboard')}
              />
            )}
            {activeTab === 'reports' && (
              <Reports />
            )}
            {activeTab === 'settings' && (
              <Settings 
                currentUser={currentUser} 
                onRefreshSession={handleRefreshSession}
              />
            )}
          </div>

        </main>
      </div>

    </div>
  );
}

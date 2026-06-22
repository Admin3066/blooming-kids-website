import React, { useState, useRef } from 'react';
import { 
  Database, ShieldAlert, Users, ClipboardList, CheckCircle, RefreshCcw, Download, Upload, Trash2, Shield, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DB } from '../db/storage';
import { User, AuditLog } from '../types';

interface SettingsProps {
  currentUser: User;
  onRefreshSession: () => void;
}

export default function Settings({ currentUser, onRefreshSession }: SettingsProps) {
  const isAdmin = currentUser.role === 'Administrator';

  // State managers
  const [users, setUsers] = useState<User[]>(() => DB.getUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => DB.getAuditLogs());
  const [activeSegment, setActiveSegment] = useState<'audit' | 'database' | 'users' | 'banking'>('audit');

  // Banking settings state
  const [settings, setSettings] = useState(() => DB.getSettings());
  const [bankName, setBankName] = useState(settings.bank_name || '');
  const [accountHolder, setAccountHolder] = useState(settings.account_holder || '');
  const [accountNumber, setAccountNumber] = useState(settings.account_number || '');
  const [branchCode, setBranchCode] = useState(settings.branch_code || '');
  const [accountType, setAccountType] = useState(settings.account_type || '');
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setErroru('');
    setSuccess('');

    const newSet = {
      bank_name: bankName,
      account_holder: accountHolder,
      account_number: accountNumber,
      branch_code: branchCode,
      account_type: accountType
    };

    const ok = await DB.saveSettings(newSet);
    setSavingSettings(false);
    if (ok) {
      setSuccess('School banking account details successfully updated on secure environment.');
      setSettings(newSet);
      setTimeout(() => setSuccess(''), 4500);
    } else {
      setErroru('Failed to save to remote server. Details saved locally.');
      setTimeout(() => setErroru(''), 4500);
    }
  };

  // Input states for creating user
  const [erroru, setErroru] = useState('');
  const [success, setSuccess] = useState('');
  const [newUName, setNewUName] = useState('');
  const [newUEmail, setNewUEmail] = useState('');
  const [newURole, setNewURole] = useState<'Administrator' | 'Principal' | 'Bursar/Cashier' | 'Teacher (view only)'>('Bursar/Cashier');
  const [newUUsername, setNewUUsername] = useState('');
  const [newUPass, setNewUPass] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshAllState = () => {
    setUsers(DB.getUsers());
    setAuditLogs(DB.getAuditLogs());
  };

  // 1. Create staff login account
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setErroru('');
    setSuccess('');

    if (!newUName || !newUUsername || !newUEmail || !newUPass) {
      setErroru('Please fill in all staff profile parameters.');
      return;
    }

    const currentUsers = DB.getUsers();
    const exists = currentUsers.some(
      u => u.username.toLowerCase() === newUUsername.toLowerCase() || u.email.toLowerCase() === newUEmail.toLowerCase()
    );

    if (exists) {
      setErroru('Username or Email address already registered to another staff member.');
      return;
    }

    const brandNew: User = {
      id: DB.generateId(),
      username: newUUsername.toLowerCase(),
      name: newUName,
      email: newUEmail,
      role: newURole,
      passwordHash: newUPass,
      active: true,
      createdAt: new Date().toISOString()
    };

    currentUsers.push(brandNew);
    DB.saveUsers(currentUsers);
    DB.log('Create User', `Successfully registered new profile for: ${newUName} (${newURole})`);

    setNewUName('');
    setNewUEmail('');
    setNewUUsername('');
    setNewUPass('');
    setSuccess(`Successfully registered credential profile for ${newUName} as ${newURole}.`);
    refreshAllState();
  };

  const handleToggleUserActive = (userId: string) => {
    if (!isAdmin) return;
    if (userId === currentUser.id) {
      alert('You cannot deactivate your own administrative session!');
      return;
    }

    const list = DB.getUsers();
    const updated = list.map(u => {
      if (u.id === userId) {
        const nextState = !u.active;
        DB.log('Toggle User Status', `Toggled active status of user ${u.username} to ${nextState}`);
        return {
          ...u,
          active: nextState
        };
      }
      return u;
    });

    DB.saveUsers(updated);
    refreshAllState();
  };

  // 2. Database backup JSON triggers
  const downloadBackup = () => {
    const dataStr = DB.backupDatabase();
    const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `BloomingKids_Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    DB.log('Download Backup', 'Bursar snapshot backup file downloaded.');
    setSuccess('Database archive downloaded successfully. Keep this JSON safe for full exports!');
    setTimeout(() => setSuccess(''), 4000);
  };

  // CSV/JSON Restore trigger
  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const content = event.target?.result as string;
      const successRestore = DB.restoreDatabase(content);
      if (successRestore) {
        setSuccess('Database restored successfully! Reloading session datasets.');
        onRefreshSession();
        refreshAllState();
        setTimeout(() => setSuccess(''), 4500);
      } else {
        alert('Data restore failed. Please verify that you selected a valid Blooming Kids JSON backup file.');
      }
    };
    fileReader.readAsText(file);
  };

  // Reset database completely
  const handleFactoryReset = () => {
    const confirm = window.confirm('DANGER AREA: You are about to wipe out all local payments, registered child parameters and custom pricing structures. Seed datasets will be reallocated. Proceed?');
    if (confirm) {
      DB.resetDatabase();
      onRefreshSession();
      refreshAllState();
      setSuccess('All datasets refreshed to clean seed configurations.');
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Console & Settings</h2>
        <p className="text-xs text-slate-500">Audit system trails, configure team permissions, and handle file restores.</p>
      </div>

      {/* HORIZONTAL WORKSPACE TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 pb-px">
        <button
          onClick={() => setActiveSegment('audit')}
          className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${activeSegment === 'audit' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-505 hover:text-slate-802'}`}
        >
          Secure Audit Trail Logs
        </button>
        <button
          onClick={() => setActiveSegment('database')}
          className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${activeSegment === 'database' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-505 hover:text-slate-802'}`}
        >
          Relational Database Tools
        </button>
        <button
          onClick={() => setActiveSegment('users')}
          className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${activeSegment === 'users' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-505 hover:text-slate-802'}`}
        >
          Staff & Access Administration
        </button>
        <button
          onClick={() => setActiveSegment('banking')}
          className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${activeSegment === 'banking' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-505 hover:text-slate-802'}`}
        >
          School Banking Details
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-805 p-3.5 border border-emerald-200 rounded-lg text-xs font-bold leading-tight flex items-center gap-2 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* TAB 1: AUDIT TRAILS */}
      {activeSegment === 'audit' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-brand-blue" />
                Relational DB Operations Registry (Audit Trails)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Strict compliance record log tracking cashier payments, student edits, and logins</p>
            </div>
            <button 
              onClick={() => { setAuditLogs(DB.getAuditLogs()); }}
              className="text-[10px] text-brand-blue hover:underline flex items-center gap-1 font-bold"
            >
              <RefreshCcw className="h-3 w-3" /> Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2 select-text text-slate-700 dark:text-slate-300">
            {auditLogs.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs">No audit logs registered.</p>
            ) : (
              auditLogs.map((log: AuditLog) => (
                <div key={log.id} className="py-2.5 text-xs flex justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">{log.action}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">{log.details}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wide text-slate-500">
                      ByUser: {log.username} ({log.role})
                    </span>
                    <p className="text-[9px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DATABASE BACKUPS */}
      {activeSegment === 'database' && (
        <div className="grid gap-6 md:grid-cols-2">
          
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-650" />
              Relational Database Persistence Exports
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              Export standard schemas (Users, Learners, Parents, Classes, Grades, FeeStructures, Payments, Receipts, statements) immediately to single file archives. You can migrate files across schools or restore them in future sessions!
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2 border-t pt-4">
              <button
                onClick={downloadBackup}
                className="rounded bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs py-2 px-4 shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Back up Database (JSON)
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 text-slate-800 dark:text-white font-bold text-xs py-2 px-4 border shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Restore from file
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestoreUpload}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          <div className="rounded-xl border border-rose-250 bg-rose-50/10 p-5 shadow-xs dark:bg-slate-900 dark:border-rose-950/20 space-y-4">
            <h3 className="font-bold text-sm text-brand-red flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand-red" />
              Destructive System Operations
            </h3>
            <p className="text-xs text-slate-505 leading-relaxed">
              Resetting the database wipes out payment registries, student profiles, and modifications. Relational configurations will be filled back with initial seed parameters for fresh evaluations.
            </p>
            <div className="pt-2 border-t border-rose-200 dark:border-rose-900">
              <button
                onClick={handleFactoryReset}
                className="rounded bg-brand-red text-white py-2 px-4 shadow hover:bg-brand-red/90 text-xs font-bold flex items-center gap-1.5 transition active:scale-98 cursor-pointer"
              >
                <RefreshCcw className="h-4 w-4" />
                Wipe & Factor Reset
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: STAFF & USER MANAGEMENT */}
      {activeSegment === 'users' && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Create User profile */}
          <div className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 h-fit">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Register Staff login</h3>
            
            {erroru && (
              <p className="mb-2 text-xs text-brand-red font-semibold bg-red-50 p-2 rounded">{erroru}</p>
            )}

            {!isAdmin ? (
              <p className="text-xs text-brand-red font-semibold p-4 bg-slate-50 dark:bg-slate-850 rounded">
                Authorization Error: Staff creations are restricted solely to secure Administrator logins.
              </p>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-550 mb-1 font-semibold">Staff Member Name</label>
                  <input
                    type="text"
                    required
                    value={newUName}
                    onChange={(e) => setNewUName(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-805 px-3 py-1.5 focus:outline-none"
                    placeholder="e.g. Sipho Sithole"
                  />
                </div>
                <div>
                  <label className="block text-slate-550 mb-1 font-semibold">Email ID</label>
                  <input
                    type="email"
                    required
                    value={newUEmail}
                    onChange={(e) => setNewUEmail(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-805 px-3 py-1.5 focus:outline-none"
                    placeholder="e.g. sipho@gmail.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-550 mb-1 font-semibold">Assign Role</label>
                    <select
                      value={newURole}
                      onChange={(e: any) => setNewURole(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-705 bg-white dark:bg-slate-805 px-2 py-1.5 focus:outline-none text-[11px]"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Principal">Principal</option>
                      <option value="Bursar/Cashier">Bursar/Cashier</option>
                      <option value="Teacher (view only)">Teacher (view only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-550 mb-1 font-semibold">Username Login</label>
                    <input
                      type="text"
                      required
                      value={newUUsername}
                      onChange={(e) => setNewUUsername(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-707 bg-white dark:bg-slate-805 px-3 py-1.5 focus:outline-none"
                      placeholder="e.g. sipho"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-550 mb-1 font-semibold">Security Password</label>
                  <input
                    type="password"
                    required
                    value={newUPass}
                    onChange={(e) => setNewUPass(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-705 bg-white dark:bg-slate-805 px-3 py-1.5 focus:outline-none"
                    placeholder="Enter robust pass"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-brand-blue text-white py-2 px-3 shadow font-bold hover:bg-brand-blue/90 cursor-pointer"
                >
                  Confirm Staff Credentials
                </button>
              </form>
            )}
          </div>

          {/* ACTIVE STAFF PROFILES TABLE */}
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-1.5 select-none">
              <Users className="h-4.5 w-4.5 text-brand-blue" />
              Active System Users ({users.length})
            </h3>
            
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left font-medium">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[9px] tracking-wider text-slate-400 font-extrabold">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Username login</th>
                    <th className="p-3">Operational Role</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{u.username}</td>
                      <td className="p-3 text-indigo-900">
                        <span className="font-semibold uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded leading-none">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isAdmin && u.id !== currentUser.id ? (
                          <button
                            onClick={() => handleToggleUserActive(u.id)}
                            className="inline-flex items-center gap-1 cursor-pointer"
                          >
                            {u.active ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <ToggleRight className="h-6 w-6 text-emerald-550" />
                                Active
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold flex items-center gap-1">
                                <ToggleLeft className="h-6 w-6 text-slate-350" />
                                Locked
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className={`inline-block font-semibold uppercase text-[9px] px-2 py-0.5 rounded ${u.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-red-50 text-brand-red dark:bg-red-950/20'}`}>
                            {u.active ? 'System Active' : 'Suspended'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: SCHOOL BANKING INTEGRATION */}
      {activeSegment === 'banking' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:bg-slate-900 dark:border-slate-850 space-y-4 text-slate-700 dark:text-slate-300">
          <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-brand-blue" />
              School Banking Account & Payment Reference Details
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Configure active banking details displayed on printed customer invoices and A4 statements.</p>
          </div>

          <form onSubmit={handleSaveBanking} className="space-y-4 max-w-xl">
            {erroru && (
              <p className="text-xs text-brand-red bg-red-50 dark:bg-red-950/25 p-2 border border-red-200 dark:border-red-900 rounded">{erroru}</p>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-550 dark:text-slate-400">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-blue text-slate-900 dark:text-white"
                  placeholder="e.g. First National Bank (FNB)"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-550 dark:text-slate-400">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-blue text-slate-900 dark:text-white"
                  placeholder="e.g. BLOOMING KIDS ECD LEARNING CENTRE"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-550 dark:text-slate-400">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-blue text-slate-900 dark:text-white"
                  placeholder="e.g. 62981034921"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-550 dark:text-slate-400">Branch Code</label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-blue text-slate-900 dark:text-white"
                  placeholder="e.g. 220127"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-550 dark:text-slate-400">Account Type</label>
                <input
                  type="text"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-blue text-slate-900 dark:text-white"
                  placeholder="e.g. Standard Commercial Cheque"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full sm:w-auto rounded bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs py-2.5 px-5 shadow transition cursor-pointer flex items-center justify-center gap-2"
              >
                {savingSettings ? 'Saving details...' : 'Save & Publish Banking Details'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

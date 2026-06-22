import React, { useState } from 'react';
import { 
  Users, Coins, Wallet, ArrowUpRight, MessageSquare, 
  Send, AlertCircle, CheckCircle2, TrendingUp, Calendar, Info
} from 'lucide-react';
import { DB } from '../db/storage';
import { Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  onNavigate: (view: string, targetId?: string) => void;
  currentUserRole: string;
}

export default function Dashboard({ onNavigate, currentUserRole }: DashboardProps) {
  const stats = DB.getGlobalStats();
  const payments = DB.getPayments();
  const learners = DB.getLearners();
  const parents = DB.getParents();
  const grades = DB.getGrades();

  // Selected state for SMS sending
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [reminderType, setReminderType] = useState<'SMS' | 'WhatsApp'>('WhatsApp');
  const [customMessage, setCustomMessage] = useState('');
  const [reminderSuccess, setReminderSuccess] = useState('');

  // 1. Calculate Monthly collections chart data dynamically
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  
  const monthlyData = monthNames.map((month, index) => {
    // Filter payments for this month in current year
    const totalAmount = payments
      .filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      name: month,
      "Collected Fees (ZAR)": totalAmount
    };
  });

  // 2. Collection Progress data for Pie Chart
  const pieData = [
    { name: "Paid Fees", value: stats.totalPaidOverall, color: "#1d3d8c" },
    { name: "Outstanding", value: stats.totalOutstanding, color: "#dc2e2a" }
  ];

  // 3. Find top outstanding debtors list for quick notification
  const debtorList = learners.map(l => {
    const s = DB.getLearnerStatement(l.id);
    const parent = parents.find(p => p.id === l.parentId);
    const grade = grades.find(g => g.id === l.gradeId);
    return {
      learnerId: l.id,
      learnerName: l.name,
      parentName: parent?.name || 'Unknown',
      parentContact: parent?.contactNumber || 'N/A',
      parentEmail: parent?.email || '',
      gradeName: grade?.code || 'N/A',
      outstanding: s ? s.outstandingBalance : 0,
      totalDue: s ? s.totalDue : 0
    };
  })
  .filter(d => d.outstanding > 0)
  .sort((a,b) => b.outstanding - a.outstanding)
  .slice(0, 5);

  const handleSelectDebtor = (id: string) => {
    setSelectedDebtorId(id);
    const debtor = debtorList.find(d => d.learnerId === id);
    if (debtor) {
      setCustomMessage(`Dear Parent of ${debtor.learnerName}, this is a friendly reminder from Blooming Kids ECD regarding your outstanding school fee balance of R ${debtor.outstanding.toLocaleString()}. Please wire payment to our standard FNB account. Thank you!`);
    } else {
      setCustomMessage('');
    }
    setReminderSuccess('');
  };

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtorId || !customMessage) return;

    const debtor = debtorList.find(d => d.learnerId === selectedDebtorId);
    if (!debtor) return;

    // Simulate sending log
    const reminderLogs = DB.getReminderLogs();
    reminderLogs.unshift({
      id: DB.generateId(),
      learnerId: debtor.learnerId,
      recipientName: debtor.parentName,
      recipientContact: debtor.parentContact,
      channel: reminderType,
      message: customMessage,
      status: 'Sent',
      timestamp: new Date().toISOString()
    });

    DB.saveReminderLogs(reminderLogs);
    DB.log(`Reminder Dispatched`, `Dispatched ${reminderType} to ${debtor.parentName} indicating balance of R ${debtor.outstanding}`);

    setReminderSuccess(`Successfully sent ${reminderType} reminder to "${debtor.parentName}" (${debtor.parentContact})`);
    
    // Clear choice
    setTimeout(() => {
      setSelectedDebtorId('');
      setCustomMessage('');
      setReminderSuccess('');
    }, 4000);
  };

  const totalFeeProgressPercent = stats.totalExpectedOverall > 0 
    ? Math.round((stats.totalPaidOverall / stats.totalExpectedOverall) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="rounded-2xl border border-slate-150 bg-gradient-to-r from-brand-blue to-teal-800 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Blooming Kids ECD Learning Centre</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Welcome to the secure bursar & administration console. Oversee annual fees, view statements, write transaction records, and print professional parent receipts.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate('learners')}
            className="rounded-lg bg-white text-brand-blue font-semibold text-xs px-4 py-2 hover:bg-slate-50 transition shadow"
          >
            Manage Learners
          </button>
          {currentUserRole !== 'Teacher (view only)' && (
            <button 
              onClick={() => onNavigate('fees')}
              className="rounded-lg bg-brand-red text-white font-semibold text-xs px-4 py-2 hover:bg-brand-red/90 transition shadow"
            >
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Learners */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 flex items-center gap-4">
          <div className="rounded-lg bg-brand-blue/10 p-3 text-brand-blue">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Learners</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.totalLearners}</h3>
            <span className="text-[10px] text-slate-400">Registered overall</span>
          </div>
        </div>

        {/* Dynamic Collected Today */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 flex items-center gap-4">
          <div className="rounded-lg bg-emerald-50 text-emerald-600 p-3 dark:bg-emerald-950/20">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Collected Today</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">R {stats.collectedToday.toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              Live Bank Ledger
            </span>
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 flex items-center gap-4">
          <div className="rounded-lg bg-rose-50 text-brand-red p-3 dark:bg-rose-950/20">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Outstanding</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">R {stats.totalOutstanding.toLocaleString()}</h3>
            <span className="text-[10px] text-brand-red font-semibold">Debtors list active</span>
          </div>
        </div>

        {/* Overall Received Fees Percentage */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 flex items-center gap-4">
          <div className="rounded-lg bg-orange-50 text-orange-600 p-3 dark:bg-orange-950/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Collection Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalFeeProgressPercent}%</h3>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-brand-blue h-full" style={{ width: `${totalFeeProgressPercent}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* VISUAL CHARTS ROW */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Monthly Income Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-250 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-955 dark:text-white">Monthly Fee Collections</h4>
              <p className="text-xs text-slate-400">Total payments registered chronologically</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>Year {currentYear}</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any) => [`R ${Number(value).toLocaleString()}`, 'Collections']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="Collected Fees (ZAR)" fill="#1d3d8c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Allocation Ratio (Pie / Stats Card) */}
        <div className="rounded-xl border border-slate-250 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-950 dark:text-white">Fee Status Ledger Breakdown</h4>
            <p className="text-xs text-slate-400">Paid Fees vs Outstanding target</p>
          </div>

          <div className="h-40 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `R ${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs text-slate-400 font-semibold">Allocated</span>
              <span className="text-base font-extrabold text-slate-850 dark:text-white">
                R {stats.totalPaidOverall.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-brand-blue"></span>
                Total Fees Settled
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                R {stats.totalPaidOverall.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-brand-red"></span>
                Outstanding Debtors
              </span>
              <span className="font-bold text-brand-red">
                R {stats.totalOutstanding.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Total Target Revenue</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                R {stats.totalExpectedOverall.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* LOWER SPLIT LAYOUT: RECENT BANK TRANSACTIONS & DEBTORS SMS TRIGGER */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Recent Registered Payments */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Payments Logged</h4>
              <p className="text-xs text-slate-400">Last verified bank and cash entries</p>
            </div>
            <button 
              onClick={() => onNavigate('receipts')}
              className="text-xs text-brand-blue hover:underline font-semibold"
            >
              All Receipts
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[300px]">
            {stats.recentPayments.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">No payments registered yet.</p>
            ) : (
              stats.recentPayments.map((p: Payment) => {
                const l = learners.find(lObj => lObj.id === p.learnerId);
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">{l?.name || 'Unknown Learner'}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.paymentMethod} • Ref: {p.reference} • {new Date(p.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-600">R {p.amount.toLocaleString()}</span>
                      <button 
                        onClick={() => onNavigate('statements', p.learnerId)}
                        className="block text-[10px] text-brand-blue hover:underline mt-0.5"
                      >
                        Statement
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* WhatsApp & SMS Payment Outstanding Reminders */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Reminders (SMS & WhatsApp)</h4>
              <p className="text-xs text-slate-400">Instantly generate client arrears templates</p>
            </div>
            <div className="rounded-full bg-blue-50 text-blue-600 p-1 dark:bg-blue-950/20" title="Relational trigger simulator">
              <Info className="h-4 w-4" />
            </div>
          </div>

          {debtorList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Terrific! No outstanding active accounts found.</p>
            </div>
          ) : (
            <form onSubmit={handleSendReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Arrears Family</label>
                <select 
                  value={selectedDebtorId}
                  onChange={e => handleSelectDebtor(e.target.value)}
                  className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Choose Debtor Parent --</option>
                  {debtorList.map(d => (
                    <option key={d.learnerId} value={d.learnerId}>
                      {d.learnerName} (Parent: {d.parentName}) — Arrears: R {d.outstanding.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDebtorId && (
                <>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="reminder-type" 
                        checked={reminderType === 'WhatsApp'}
                        onChange={() => setReminderType('WhatsApp')}
                        className="accent-brand-blue" 
                      />
                      WhatsApp Channel
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="reminder-type" 
                        checked={reminderType === 'SMS'}
                        onChange={() => setReminderType('SMS')}
                        className="accent-brand-blue" 
                      />
                      SMS Text Message
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Message Outline</label>
                    <textarea 
                      rows={3}
                      value={customMessage}
                      onChange={e => setCustomMessage(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-905 dark:text-white focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full rounded bg-brand-blue text-white py-2 px-3 text-xs font-semibold shadow hover:bg-brand-blue/90 flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Send className="h-3 w-3" />
                    Dispatch Arrears Reminder
                  </button>
                </>
              )}

              {reminderSuccess && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{reminderSuccess}</span>
                </div>
              )}

              {!selectedDebtorId && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-brand-red select-none text-slate-400" />
                  <span>Select an outstanding balance family above to preview and trigger automatic SMS or WhatsApp billing alerts.</span>
                </div>
              )}
            </form>
          )}
        </div>

      </div>

    </div>
  );
}

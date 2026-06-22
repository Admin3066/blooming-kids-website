import React, { useState, useEffect } from 'react';
import { 
  Printer, ArrowLeft, Download, Bookmark, Landmark, Calendar, Clipboard, ShieldCheck, Mail, Smartphone
} from 'lucide-react';
import { DB } from '../db/storage';
import { Learner } from '../types';
import { downloadElementAsPDF } from '../utils/downloadPdf';

interface StatementProps {
  activeLearnerId?: string;
  onBackToDashboard?: () => void;
}

export default function FeeStatements({ activeLearnerId = '', onBackToDashboard }: StatementProps) {
  const [selectedLearnerId, setSelectedLearnerId] = useState(activeLearnerId);
  const learners = DB.getLearners();

  const [showSandboxNotice, setShowSandboxNotice] = useState(false);

  useEffect(() => {
    if (activeLearnerId) {
      setSelectedLearnerId(activeLearnerId);
    }
  }, [activeLearnerId]);

  const statement = selectedLearnerId ? DB.getLearnerStatement(selectedLearnerId) : null;
  const bankSettings = DB.getSettings();

  const handlePrint = () => {
    DB.log('Generate Statement', `Printed ledger statement for learner ID: ${selectedLearnerId}`);
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!statement) return;
    setShowSandboxNotice(true);
    const sanitizedStudentName = statement.learner.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `statement_${sanitizedStudentName}_${statement.learner.admissionNumber}.pdf`;
    DB.log('Download Statement PDF', `Downloaded PDF ledger statement for learner: ${statement.learner.name}`);
    downloadElementAsPDF('statement-print-area', filename);
  };

  return (
    <div className="space-y-6">
      
      {/* ACTION HEADER / FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Relational Ledger Statements</h2>
          <p className="text-xs text-slate-500">Examine running transactional balances, payments and credits on an itemized timeline.</p>
        </div>
        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Portal Home
            </button>
          )}

          <select
            value={selectedLearnerId}
            onChange={(e) => setSelectedLearnerId(e.target.value)}
            className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">-- Choose Learner Profile --</option>
            {learners.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.admissionNumber})</option>
            ))}
          </select>

          {statement && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-1.5 px-3.5 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Open system print interface"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="rounded bg-brand-blue text-white font-bold text-xs py-1.5 px-4 shadow hover:bg-brand-blue/90 flex items-center gap-1.5 transition cursor-pointer"
                title="Download statement directly as PDF file"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RENDER DYNAMIC A4 PRINT-FRIENDLY CONTAINER */}
      {statement ? (
        <>
          {showSandboxNotice && (
            <div className="no-print bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/40 text-amber-900 dark:text-amber-350 rounded-xl p-4 text-xs leading-relaxed flex items-start gap-3 shadow-sm max-w-4xl mx-auto">
              <span className="text-lg select-none">💡</span>
              <div className="space-y-1">
                <p className="font-extrabold text-amber-950 dark:text-amber-200">Notice: PDF Download in Preview Sandbox Mode</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Because this application is currently running inside the **secure preview window (iframe)**, web browsers strictly block any direct file downloads from this pane. 
                </p>
                <div className="pt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <p className="font-bold text-slate-805 dark:text-slate-300">
                    Option A (Easiest): Click <span className="bg-white dark:bg-slate-805 px-1.5 py-0.5 rounded border border-slate-205 font-extrabold uppercase">Print</span> and select <span className="font-extrabold">"Save as PDF"</span> in your system options.
                  </p>
                  <p className="font-bold text-slate-805 dark:text-slate-300">
                    Option B: Click <span className="font-extrabold">"Open in new tab"</span> at the top right of your workspace to download directly!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div id="statement-print-area" className="mx-auto w-full max-w-4xl bg-white border border-slate-200 dark:text-black shadow-xl p-8 md:p-12 rounded-xl text-xs space-y-6 print-container select-text">
          
          {/* STATEMENT LOGO HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b border-rose-600 pb-5 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-blue">
                {/* SVG Shield Logo Represent */}
                <svg className="h-8 w-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0a5 5 0 00-5 5v3a5 5 0 005-5zm0 0a5 5 0 015 5v3a5 5 0 01-5-5z" />
                </svg>
                <h1 className="text-xl font-black tracking-tight uppercase leading-none">
                  BLOOMING KIDS ECD LEARNING CENTRE
                </h1>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-brand-red">Early Childhood Learning Centre</p>
              <p className="text-[10px] text-slate-500 mt-1">22 Umlalazi Road Emlanjeni KwaMashu, Durban, 4359</p>
              <p className="text-[9px] text-slate-500 leading-tight">
                Phone: 082 746 2182 | Website: bloomingkidecd.com | Email: bloomingkids721@gmail.com | Reg Number: 181-259NPO
              </p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase">OFFICIAL FEE STATEMENT</h2>
              <div className="text-[9px] text-slate-500 space-y-0.5 leading-tight">
                <p><span className="font-semibold text-slate-700">Statement Date:</span> {new Date().toLocaleDateString()}</p>
                <p><span className="font-semibold text-slate-700">Statement Period:</span> Fiscal Year {new Date().getFullYear()}</p>
                <p className="text-xs font-black text-brand-red mt-2">ACCOUNT BALANCE: R {statement.outstandingBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Sibling parent and child indices details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wide font-extrabold text-slate-400 block">Student profile</span>
              <p className="text-sm font-black text-slate-900">{statement.learner.name}</p>
              <p><span className="font-semibold text-slate-600">Admission No. :</span> <span className="font-mono font-bold text-slate-800">{statement.learner.admissionNumber}</span></p>
              <p><span className="font-semibold text-slate-600">Grade Level:</span> <span className="font-bold text-slate-800">{statement.grade?.name}</span></p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wide font-extrabold text-slate-400 block">Responsible Parent / Guardian</span>
              <p className="text-sm font-black text-slate-900">{statement.parent?.name || 'Unknown'}</p>
              <p><span className="font-semibold text-slate-600">Primary Contact:</span> <span className="font-bold text-slate-805">{statement.parent?.contactNumber}</span></p>
              <p><span className="font-semibold text-slate-600">Email Address:</span> <span className="font-bold text-slate-805">{statement.parent?.email || 'N/A'}</span></p>
              <p><span className="font-semibold text-slate-600">Residential Address:</span> <span className="text-slate-650 font-bold">{statement.parent?.address || 'N/A'}</span></p>
            </div>
          </div>

          {/* ACCOUNT FINANCIAL MATRIX RUNNING TIMELINE */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 border-b border-slate-100 pb-1 flex items-center gap-1.5 select-none mt-1">
              <Bookmark className="h-4 w-4 text-brand-blue" />
              Tuition Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 uppercase text-[9px] tracking-wider text-slate-550 border-b-2 border-slate-205 font-extrabold">
                    <th className="py-2.5 px-3">Transaction Date</th>
                    <th className="py-2.5 px-3">Description / Narrative</th>
                    <th className="py-2.5 px-3 text-right">Debit Cost</th>
                    <th className="py-2.5 px-3 text-right">Credit Settled</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statement.ledger.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-slate-450">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{item.description}</td>
                      <td className="py-2 px-3 text-right font-semibold font-mono text-slate-700">
                        {item.charge !== undefined ? (item.charge < 0 ? `(${Math.abs(item.charge).toLocaleString()})` : `R ${item.charge.toLocaleString()}`) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold font-mono text-emerald-600">
                        {item.payment !== undefined ? `R ${item.payment.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold font-mono text-slate-900">
                        R {item.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOWER SUMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            
            {/* SCHOOL TRANSFER EFT DETAILS */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-brand-blue flex items-center gap-1">
                <Landmark className="h-4 w-4" />
                School EFT Payment Instructions
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Please make use of electronic transfers (EFT) or direct deposits to settle arrears. Always reference payments correctly with your assigned student's full name to credit the database.
              </p>
              <div className="bg-slate-50 p-3 rounded border border-slate-150 space-y-1 font-semibold text-[10px] text-slate-705 leading-tight">
                <p><span className="text-slate-400">Account Bank:</span> {bankSettings.bank_name || 'First National Bank (FNB)'}</p>
                <p><span className="text-slate-400">Account Holder Name:</span> {bankSettings.account_holder || 'Blooming Kids ECD'}</p>
                <p><span className="text-slate-400">Account ID Number:</span> {bankSettings.account_number || '62677098016'}</p>
                <p><span className="text-slate-400">Branch Route Code:</span> {bankSettings.branch_code || '250 655'}</p>
                <p><span className="text-slate-400">Account Type:</span> {bankSettings.account_type || 'Current Account'}</p>
                <p className="text-brand-red flex items-center gap-1 bg-red-50 p-1.5 rounded mt-1.5 select-none font-bold">
                  <ShieldCheck className="h-4 w-4 text-brand-red shrink-0" />
                  <span>PAYMENT REFERENCE: {statement.learner.name}</span>
                </p>
              </div>
            </div>

            {/* FINANCIAL TALLY BLOCK SUMMARY */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg h-fit space-y-2">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-450">Accounts Summary (ZAR)</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Total Gross Tuition Charged:</span>
                  <span className="font-bold font-mono text-slate-800">R {statement.totalCharged.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-teal-600">
                  <span className="font-semibold">Scholarships & Reductions:</span>
                  <span className="font-bold font-mono">-R {statement.totalDiscounts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-205 pt-1.5">
                  <span className="text-slate-500 font-extrabold">Net Adjusted Target Due:</span>
                  <span className="font-extrabold font-mono text-slate-905">R {statement.totalDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span className="font-semibold">Payments Credited:</span>
                  <span className="font-bold font-mono">R {statement.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t-2 border-slate-350 pt-2 text-brand-red">
                  <span className="font-black text-[11px] uppercase">TOTAL ARREARS OWING:</span>
                  <span className="font-black font-mono text-sm">R {statement.outstandingBalance.toLocaleString()}</span>
                </div>

                {/* INSTALLMENT PLAN SUB-STATUS CARD */}
                <div className="border-t border-dashed border-slate-250 pt-2 mt-2 select-none">
                  <div className="flex justify-between items-center bg-emerald-50/70 p-2 rounded border border-emerald-100">
                    <div>
                      <span className="block text-[8px] font-black text-emerald-800 uppercase tracking-wider">Installment Plan Status</span>
                      <span className="text-[8px] text-slate-500 font-semibold leading-none">R400/pm • Month-to-Month Basis</span>
                    </div>
                    <span className="inline-block text-[8px] font-black uppercase bg-emerald-600 text-white py-0.5 px-1.5 rounded-sm tracking-wide">
                      Up To Date
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-400 mt-1 font-medium leading-tight">
                    *Blooming Kids fees are paid monthly in installments. As long as current month installments are settled, account holds active status.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* TERMS AND SIGN-OFFS AND ADVERTISING PROMPT */}
          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-[9px] text-slate-400 text-center md:text-left gap-4">
            <div>
              <p className="font-bold text-slate-650">Blooming Kids Bursar Office • Emelda T. Luthuli (Principal)</p>
              <p>Generated securely on Blooming Kids cloud ledger servers.</p>
            </div>
            <div className="text-right uppercase font-extrabold text-brand-red font-mono tracking-widest text-[8px] select-none">
              BLOOMING KIDS ECD LEARNING CENTRE • Settle arrears on time
            </div>
          </div>

        </div>
      </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-350 bg-slate-50/50 p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <BookMarkSimulate className="h-8 w-8 text-slate-400 mb-2 stroke-1" />
          <span>No student record loaded. Please select a registered student's profile inside the top action bar to compile their relational invoice ledger.</span>
        </div>
      )}

    </div>
  );
}

function BookMarkSimulate({ ...props }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

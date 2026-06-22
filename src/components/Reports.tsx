import React, { useState } from 'react';
import { 
  FileSpreadsheet, Printer, Grid, Users, ArrowUpRight, TrendingUp, Filter, BarChart, ChevronDown, CheckCircle, Download
} from 'lucide-react';
import { DB } from '../db/storage';
import { Learner, Payment, Parent, Grade } from '../types';
import { downloadElementAsPDF } from '../utils/downloadPdf';

export default function Reports() {
  const learners = DB.getLearners();
  const payments = DB.getPayments();
  const parents = DB.getParents();
  const grades = DB.getGrades();

  // Active workspace subsection: 1. Collections ledger, 2. Arrears Debtors ledger
  const [reportTab, setReportTab] = useState<'collections' | 'debtors'>('collections');

  // Filters
  const [filterGradeId, setFilterGradeId] = useState('');

  // Export success flag UI feedback
  const [exportSuccess, setExportSuccess] = useState('');

  // 1. Calculate historical metrics
  const now = new Date();
  
  // Daily Collections
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyTotal = payments
    .filter(p => new Date(p.paymentDate) >= startOfToday)
    .reduce((sum, p) => sum + p.amount, 0);

  // Monthly Collections
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyTotal = payments
    .filter(p => new Date(p.paymentDate) >= startOfMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  // Annual collections
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const annualTotal = payments
    .filter(p => new Date(p.paymentDate) >= startOfYear)
    .reduce((sum, p) => sum + p.amount, 0);

  // 2. Collate Outstanding Debtors Dynamic Table
  const debtorsList = learners.map(l => {
    const s = DB.getLearnerStatement(l.id);
    const parent = parents.find(p => p.id === l.parentId);
    const gr = grades.find(g => g.id === l.gradeId);
    return {
      learnerName: l.name,
      admissionNumber: l.admissionNumber,
      gradeCode: gr?.code || 'N/A',
      gradeId: l.gradeId,
      parentName: parent?.name || 'N/A',
      parentContact: parent?.contactNumber || 'N/A',
      parentEmail: parent?.email || '',
      grossCharged: s ? s.totalCharged : 0,
      discounts: s ? s.totalDiscounts : 0,
      netDue: s ? s.totalDue : 0,
      paid: s ? s.totalPaid : 0,
      outstanding: s ? s.outstandingBalance : 0
    };
  })
  .filter(d => d.outstanding > 0)
  .sort((a, b) => b.outstanding - a.outstanding);

  // Filter debtors by grade level if applicable
  const filteredDebtors = debtorsList.filter(d => filterGradeId ? d.gradeId === filterGradeId : true);

  // 3. Collate Paid Fees metrics table
  const paidSettledList = learners.map(l => {
    const s = DB.getLearnerStatement(l.id);
    const gr = grades.find(g => g.id === l.gradeId);
    return {
      learnerName: l.name,
      admissionNumber: l.admissionNumber,
      gradeCode: gr?.code || 'N/A',
      gradeId: l.gradeId,
      totalDue: s ? s.totalDue : 0,
      totalPaid: s ? s.totalPaid : 0,
      outstanding: s ? s.outstandingBalance : 0
    };
  })
  .filter(l => l.totalPaid > 0);

  // Filter paid list
  const filteredPaid = paidSettledList.filter(d => filterGradeId ? d.gradeId === filterGradeId : true);

  // 4. Excel spreadsheet export triggering
  const exportToExcel = (type: 'collections' | 'debtors') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'collections') {
      csvContent += "Transaction Date,Receipt Number,Learner Name,Payment Method,Reference Code,Amount (ZAR)\n";
      payments.forEach(p => {
        const l = learners.find(lObj => lObj.id === p.learnerId);
        csvContent += `"${new Date(p.paymentDate).toLocaleDateString()}","${p.receiptNumber}","${l?.name || 'Unknown'}","${p.paymentMethod}","${p.reference}",${p.amount}\n`;
      });
    } else {
      csvContent += "Student Name,Admission Number,Grade Level,Parent Name,Phone Contact,Fees Due (R),Settled (R),Arrears Balance (R)\n";
      debtorsList.forEach(d => {
        csvContent += `"${d.learnerName}","${d.admissionNumber}","${d.gradeCode}","${d.parentName}","${d.parentContact}",${d.netDue},${d.paid},${d.outstanding}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BloomingKids_Report_${type}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    DB.log('Export Spreadsheet', `Exported standard ${type} database registry summary to CSV spreadsheet.`);
    setExportSuccess(`CSV Ledger saved! Registered Microsoft Excel compatible spreadsheet of "${type}" successfully downloaded.`);
    setTimeout(() => setExportSuccess(''), 4500);
  };

  const triggerPrintAudit = () => {
    DB.log('Print Audit Report', `A4 school auditor sheets generated.`);
    window.print();
  };

  const handleDownloadReportPDF = () => {
    const currentDateStr = new Date().toLocaleDateString().replace(/\//g, '-');
    if (reportTab === 'collections') {
      DB.log('Download Collections PDF', `Downloaded PDF of daily & monthly collections log.`);
      downloadElementAsPDF('collections-report-container', `collections_report_${currentDateStr}.pdf`);
    } else {
      DB.log('Download Debtors PDF', `Downloaded PDF of outstanding debtors arrears register.`);
      downloadElementAsPDF('debtors-report-container', `debtors_report_${currentDateStr}.pdf`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ACTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Auditing & Reports Dashboard</h2>
          <p className="text-xs text-slate-500">Examine collection milestones, trace revenue, and export ledger csv formats.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(reportTab)}
            className="rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-1.5 px-3 shadow flex items-center gap-1 cursor-pointer transition active:scale-98"
            title="Download report data as standard Excel CSV"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={triggerPrintAudit}
            className="rounded bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-1.5 px-3 shadow-xs flex items-center gap-1 cursor-pointer transition active:scale-98"
            title="Open system printing settings"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleDownloadReportPDF}
            className="rounded bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs py-1.5 px-3.5 shadow flex items-center gap-1 cursor-pointer transition active:scale-98"
            title="Compile and download report directly as A4 PDF document"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-805 flex items-center gap-2 dark:bg-emerald-950/20 dark:text-emerald-400 no-print animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* QUICK STATUS METRIC CLUSTERS (PRINT FRIENDLY) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:bg-slate-900 dark:border-slate-850">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collections Today</span>
          <h3 className="text-xl font-extrabold text-indigo-900 dark:text-indigo-400 mt-1">
            R {dailyTotal.toLocaleString()}
          </h3>
          <p className="text-[9px] text-slate-400 mt-0.5">Live current bank settlement</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:bg-slate-900 dark:border-slate-850">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-bold">Month-to-Date Collections</span>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
            R {monthlyTotal.toLocaleString()}
          </h3>
          <p className="text-[9px] text-slate-450 mt-0.5">MTD cumulative ledger sum</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:bg-slate-900 dark:border-slate-850">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Yearly Cumulative Income</span>
          <h3 className="text-xl font-extrabold text-teal-600 mt-1">
            R {annualTotal.toLocaleString()}
          </h3>
          <p className="text-[9px] text-slate-400 mt-0.5">Annual total gross target</p>
        </div>
      </div>

      {/* INTERNAL TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-850 gap-1 no-print">
        <button
          onClick={() => setReportTab('collections')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${reportTab === 'collections' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Daily & Monthly Collections Log
        </button>
        <button
          onClick={() => setReportTab('debtors')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${reportTab === 'debtors' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Outstanding Debtors Register (Arrears)
        </button>
      </div>

      {/* SUBSECTION PAGE 1: DETAILED DAILY COLLECTIONS LOG */}
      {reportTab === 'collections' && (
        <div id="collections-report-container" className="rounded-xl border border-slate-200 bg-white shadow-xs dark:bg-slate-900 dark:border-slate-850 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">All Payment Transactions</h4>
            
            <div className="flex gap-2">
              <select
                value={filterGradeId}
                onChange={(e) => setFilterGradeId(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-805 px-2 py-1 text-[10px] font-bold focus:outline-none"
              >
                <option value="">-- All Grades --</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.code}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto text-[11px] leading-tight select-text">
            {payments.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No payment logs found.</p>
            ) : (
              <table className="w-full text-left font-medium">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[9px] tracking-wider text-slate-500 font-extrabold border-b">
                  <tr>
                    <th className="py-2.5 px-4">Transaction Date</th>
                    <th className="py-2.5 px-4">Receipt Num</th>
                    <th className="py-2.5 px-4">Learner / Admission Number</th>
                    <th className="py-2.5 px-4">Payment Channel</th>
                    <th className="py-2.5 px-4">Bank Reference</th>
                    <th className="py-2.5 px-4 text-right">Amount (ZAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments
                    .filter(p => {
                      const l = learners.find(lObj => lObj.id === p.learnerId);
                      return filterGradeId ? l?.gradeId === filterGradeId : true;
                    })
                    .map(p => {
                      const l = learners.find(lObj => lObj.id === p.learnerId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-mono text-slate-450">{new Date(p.paymentDate).toLocaleString()}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{p.receiptNumber}</td>
                          <td className="py-2.5 px-4 font-extrabold text-slate-800 dark:text-slate-150">
                            {l?.name || 'Unknown'} <span className="font-mono text-slate-405 font-bold">({l?.admissionNumber})</span>
                          </td>
                          <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-indigo-700">{p.paymentMethod}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-450">{p.reference}</td>
                          <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                            R {p.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUBSECTION PAGE 2: OUTSTANDING DEBTORS ENTIRE LIST */}
      {reportTab === 'debtors' && (
        <div id="debtors-report-container" className="rounded-xl border border-slate-200 bg-white shadow-xs dark:bg-slate-900 dark:border-slate-850 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between no-print">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Unsettled Invoices Debtor list ({filteredDebtors.length})</h4>
            
            <div className="flex gap-2">
              <select
                value={filterGradeId}
                onChange={(e) => setFilterGradeId(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-805 px-2 py-1 text-[10px] font-bold focus:outline-none"
              >
                <option value="">-- All Grades --</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.code}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto text-[11px] leading-tight select-text font-medium">
            {filteredDebtors.length === 0 ? (
              <p className="p-8 text-center text-slate-400">Terrific! No outstanding debtors found matching selection.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[9px] tracking-wider text-slate-550 font-extrabold border-b">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Guardian Contact Details</th>
                    <th className="py-3 px-4 text-right">Net Charged</th>
                    <th className="py-3 px-4 text-right">Total Settled</th>
                    <th className="py-3 px-4 text-right text-brand-red">Arrears Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredDebtors.map((d, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{d.learnerName}</p>
                        <p className="text-[10px] text-slate-405 font-mono">{d.admissionNumber}</p>
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-slate-500">{d.gradeCode}</td>
                      <td className="py-3 px-3.5">
                        <p className="font-bold text-slate-800 dark:text-slate-205">{d.parentName}</p>
                        <p className="text-[10px] text-slate-450 font-mono mt-0.5">{d.parentContact} • {d.parentEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold font-mono">R {d.netDue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold font-mono text-emerald-600">R {d.paid.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black font-mono text-brand-red">
                        R {d.outstanding.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

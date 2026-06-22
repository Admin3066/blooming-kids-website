import React, { useState } from 'react';
import { 
  Search, Printer, CheckCircle, Smartphone, Mail, Eye, Download, Info, Tag, Calendar, User, Edit2, Trash2, XCircle, Save
} from 'lucide-react';
import { DB } from '../db/storage';
import { Receipt, Payment, Learner, Parent, User as SystemUser } from '../types';
import { downloadElementAsPDF } from '../utils/downloadPdf';

export default function ReceiptsManagement() {
  // Lists from DB
  const [receipts, setReceipts] = useState<Receipt[]>(() => DB.getReceipts());
  const payments = DB.getPayments();
  const [learners] = useState<Learner[]>(() => DB.getLearners());
  const [parents] = useState<Parent[]>(() => DB.getParents());
  const [users] = useState<SystemUser[]>(() => DB.getUsers());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Selected receipt to view / print details
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  // Reminders trigger
  const [sentAlert, setSentAlert] = useState('');

  // Payment editing and deletion states
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editMethod, setEditMethod] = useState('');
  const [editNote, setEditNote] = useState('');
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const currentUser = DB.getCurrentUser();
  const isViewOnly = currentUser?.role === 'Teacher (view only)';

  const handleOpenEditPayment = (p: Payment) => {
    setEditAmount(p.amount.toString());
    setEditRef(p.reference || '');
    const d = new Date(p.paymentDate);
    const dateStr = d.toISOString().split('T')[0];
    setEditDate(dateStr);
    setEditMethod(p.paymentMethod);
    setEditNote(p.note || '');
    setIsEditingPayment(true);
  };

  const handleSavePaymentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReceipt || !currentPay) return;

    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    let finalDate = currentPay.paymentDate;
    if (editDate) {
      const parsedDate = new Date(editDate);
      if (!isNaN(parsedDate.getTime())) {
        parsedDate.setHours(12, 0, 0, 0);
        finalDate = parsedDate.toISOString();
      }
    }

    const currentPayments = DB.getPayments();
    const updatedPayments = currentPayments.map(p => {
      if (p.id === currentPay.id) {
        return {
          ...p,
          amount: amountNum,
          paymentDate: finalDate,
          paymentMethod: editMethod,
          reference: editRef,
          note: editNote
        };
      }
      return p;
    });

    DB.savePayments(updatedPayments);

    const currentReceipts = DB.getReceipts();
    const updatedReceipts = currentReceipts.map(r => {
      if (r.id === activeReceipt.id) {
        return {
          ...r,
          dateGenerated: finalDate,
          qrCodeValue: `VERIFY:BK-${r.receiptNumber}:R${amountNum}`
        };
      }
      return r;
    });
    DB.saveReceipts(updatedReceipts);

    setReceipts(updatedReceipts);
    setIsEditingPayment(false);
    DB.log('Update Payment Entry', `Modified payment ID ${currentPay.id} (receipt ${activeReceipt.receiptNumber}) to R ${amountNum}`);
    setSentAlert('Payment record updated successfully.');
    setTimeout(() => setSentAlert(''), 5050);

    const freshActive = updatedReceipts.find(r => r.id === activeReceipt.id);
    if (freshActive) setActiveReceipt(freshActive);
  };

  const handleDeletePayment = (pId: string) => {
    if (!activeReceipt) return;

    const currentPayments = DB.getPayments();
    const filteredPayments = currentPayments.filter(p => p.id !== pId);
    DB.savePayments(filteredPayments);

    const currentReceipts = DB.getReceipts();
    const filteredReceiptsList = currentReceipts.filter(r => r.paymentId !== pId);
    DB.saveReceipts(filteredReceiptsList);

    setReceipts(filteredReceiptsList);
    setDeletingPaymentId(null);
    DB.log('Delete Payment Entry', `Permanently deleted payment transaction ID: ${pId} associated with receipt: ${activeReceipt.receiptNumber}`);
    
    setSentAlert(`Payment and receipt voucher ${activeReceipt.receiptNumber} successfully deleted.`);
    setTimeout(() => setSentAlert(''), 5050);
    setActiveReceipt(null);
  };

  const filteredReceipts = receipts.filter(r => {
    const l = learners.find(learn => learn.id === r.learnerId);
    return (
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l && l.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l && l.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleReprint = (r: Receipt) => {
    // Increment reprint tally
    const currentReceipts = DB.getReceipts();
    const updated = currentReceipts.map(item => {
      if (item.id === r.id) {
        return {
          ...item,
          printedCount: item.printedCount + 1
        };
      }
      return item;
    });
    DB.saveReceipts(updated);
    setReceipts(updated);

    // Update active
    const actualActive = updated.find(item => item.id === r.id);
    if (actualActive) setActiveReceipt(actualActive);

    DB.log('Reprint Receipt', `Reprinted receipt: ${r.receiptNumber} for student ID: ${r.learnerId}`);

    // Trigger standard browser window print selection targeting the receipt sheet specifically
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadReceiptPDF = (r: Receipt) => {
    const l = learners.find(learn => learn.id === r.learnerId);
    const sanitizedName = l ? l.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'student';
    const filename = `receipt_${r.receiptNumber.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${sanitizedName}.pdf`;

    DB.log('Download Receipt PDF', `Downloaded PDF receipt: ${r.receiptNumber} for learner: ${l?.name}`);
    downloadElementAsPDF('school-receipt-slip', filename);
  };

  const handleSimulateAlert = (type: 'SMS' | 'WhatsApp' | 'Email', r: Receipt) => {
    const l = learners.find(learn => learn.id === r.learnerId);
    const parent = parents.find(p => p.id === l?.parentId);
    if (!parent) return;

    setSentAlert(`Simulated Alert: Successfully dispatched receipt voucher of ${r.receiptNumber} directly via ${type} to parent "${parent.name}" (${parent.contactNumber}).`);
    setTimeout(() => setSentAlert(''), 5050);
  };

  // Live selected relations lookup
  const currentPay = activeReceipt ? payments.find(p => p.id === activeReceipt.paymentId) : null;
  const currentLearner = activeReceipt ? learners.find(l => l.id === activeReceipt.learnerId) : null;
  const currentParent = currentLearner ? parents.find(p => p.id === currentLearner.parentId) : null;
  const currentBursar = currentPay ? users.find(u => u.id === currentPay.receivedByUserId) : null;

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Relational Payment Receipts</h2>
        <p className="text-xs text-slate-500">Query generated payment invoices, reprint vouchers, or dispatch alerts to parents</p>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:bg-slate-900 dark:border-slate-850 flex gap-3">
        <div className="relative flex-1 text-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none"
            placeholder="Filter receipt number voucher, child name, or admission index..."
          />
        </div>
      </div>

      {sentAlert && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-250 text-xs font-bold leading-tight flex items-center gap-2 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{sentAlert}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* RECEIPTS MASTER LIST TABLE */}
        <div className="lg:col-span-1.5 rounded-xl border border-slate-200 bg-white shadow-xs dark:bg-slate-900 dark:border-slate-850 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Historical Generated Vouchers</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto">
            {filteredReceipts.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-xs">No matching receipt logs found.</p>
            ) : (
              filteredReceipts.map(rec => {
                const pay = payments.find(p => p.id === rec.paymentId);
                const l = learners.find(learn => learn.id === rec.learnerId);
                return (
                  <button
                    key={rec.id}
                    onClick={() => { setActiveReceipt(rec); setSentAlert(''); }}
                    className={`w-full text-left p-3.5 hover:bg-slate-50/55 dark:hover:bg-slate-850 flex items-center justify-between text-xs transition cursor-pointer border-r-2 ${activeReceipt?.id === rec.id ? 'bg-brand-blue/5 border-brand-blue dark:bg-brand-blue/10' : 'border-transparent'}`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{rec.receiptNumber}</h4>
                      <p className="text-[10px] text-slate-405 mt-0.5 font-semibold">
                        Student: {l?.name || 'Unknown'} (#{l?.admissionNumber || 'N/A'})
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {pay ? new Date(pay.paymentDate).toLocaleDateString() : 'N/A'} • Reprinted: {rec.printedCount} times
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-600 font-mono text-xs">
                        R {pay ? pay.amount.toLocaleString() : '0.00'}
                      </span>
                      <span className="block text-[10px] text-brand-blue hover:underline mt-1 font-semibold flex items-center justify-end gap-0.5">
                        <Eye className="h-3 w-3" /> View Slip
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RECEIPT DETAIL PREVIEW (A4 Voucher Printable Card Design) */}
        <div className="lg:col-span-1.5 space-y-4">
          
          {activeReceipt && currentPay && currentLearner ? (
            isEditingPayment ? (
              /* VOUCHER EDIT FORM DISPLAYED INSTEAD */
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Edit Payment Details</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Voucher Reference: {activeReceipt.receiptNumber}</p>
                  </div>
                  <button
                    onClick={() => setIsEditingPayment(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleSavePaymentEdit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Amount Paid (ZAR)</label>
                    <input
                      type="number"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Payment Method</label>
                    <select
                      value={editMethod}
                      onChange={(e) => setEditMethod(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="Cash">Cash payment</option>
                      <option value="Bank EFT">Bank EFT</option>
                      <option value="Direct Deposit">Direct Deposit</option>
                      <option value="POS Card terminal">POS Card terminal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Transaction Link Reference</label>
                    <input
                      type="text"
                      value={editRef}
                      onChange={(e) => setEditRef(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Private Comments (Ledger commentary)</label>
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      className="flex-1 rounded bg-brand-blue text-white py-2 px-3 font-bold hover:bg-brand-blue/90 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="h-4 w-4" /> Save adjustments
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPayment(false)}
                      className="rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-305 py-2 px-4 font-bold hover:bg-slate-250 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* PRINT CONTAINER WITH SUB-CONTROLS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReprint(activeReceipt)}
                    className="flex-1 rounded-lg bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 px-3 shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Open system printer output"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                  <button
                    onClick={() => handleDownloadReceiptPDF(activeReceipt)}
                    className="flex-1 rounded-lg bg-brand-blue text-white font-bold text-xs py-2 px-3 shadow hover:bg-brand-blue/90 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Download receipt directly as PDF"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => handleSimulateAlert('WhatsApp', activeReceipt)}
                    className="rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 font-bold text-xs p-2 shadow-xs hover:bg-emerald-100 flex items-center gap-1 transition cursor-pointer"
                    title="Forward WhatsApp alerting"
                  >
                    <Smartphone className="h-4 w-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleSimulateAlert('Email', activeReceipt)}
                    className="rounded-lg bg-indigo-50 text-brand-blue dark:bg-indigo-950/20 font-bold text-xs p-2 shadow-xs hover:bg-indigo-100 flex items-center gap-1 transition cursor-pointer"
                    title="Forward Email voucher"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                </div>

                {/* ADMIN MODIFICATION ACTIONS BAR */}
                {!isViewOnly && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-slate-850/40 rounded-xl border border-blue-100/50 dark:border-slate-800/60 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
                      <Info className="h-3.5 w-3.5 text-brand-blue" />
                      Admin Tools:
                    </span>
                    
                    <button
                      onClick={() => handleOpenEditPayment(currentPay)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit details
                    </button>

                    <div className="ml-auto flex items-center">
                      {deletingPaymentId === currentPay.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 p-1 rounded border border-red-100 dark:border-red-900/40">
                          <span className="text-[10px] text-brand-red font-bold">Wipe receipt?</span>
                          <button
                            onClick={() => handleDeletePayment(currentPay.id)}
                            className="px-2 py-0.5 text-[10px] bg-brand-red text-white hover:bg-brand-red/90 rounded font-bold"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingPaymentId(null)}
                            className="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded font-bold"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingPaymentId(currentPay.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 hover:bg-brand-red hover:text-white text-brand-red font-bold transition cursor-pointer border border-red-100/40 dark:border-red-950/30"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete payment
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* VOUCHER PREVIEW SLIP (STRICTLY PRINT SAFE IN A4) */}
              <div id="school-receipt-slip" className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 dark:bg-white dark:text-black dark:border-slate-300 shadow-xl space-y-6">
                
                {/* 1. Header with school details & logo representation */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-brand-blue">BLOOMING KIDS ECD</h3>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-brand-red">Early Childhood Learning Centre</p>
                    <div className="text-[9px] text-slate-500 mt-1 space-y-0.5 leading-tight">
                      <p>22 Umlalazi Road Emlanjeni KwaMashu, Durban, 4359</p>
                      <p>Phone: 082 746 2182 | Website: bloomingkidecd.com | Support: bloomingkids721@gmail.com</p>
                      <p>Registration No: 181-259NPO</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold bg-blue-50 text-brand-blue py-0.5 px-2 rounded mb-1">
                      OFFICIAL PAYMENT RECEIPT
                    </span>
                    <h2 className="text-lg font-black tracking-tight text-slate-800">{activeReceipt.receiptNumber}</h2>
                    <p className="text-[9px] text-slate-400 mt-0.5">Date Slip: {new Date(currentPay.paymentDate).toLocaleString()}</p>
                  </div>
                </div>

                {/* 2. Transaction details grid */}
                <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 dark:bg-slate-50 border border-slate-150 p-3.5 rounded-lg">
                  <div>
                    <p className="text-slate-450 uppercase font-bold">Child Registry details</p>
                    <p className="font-extrabold text-slate-900 mt-1">{currentLearner.name}</p>
                    <p className="text-slate-500 font-semibold mt-0.5">Admission #: {currentLearner.admissionNumber}</p>
                    <p className="text-slate-500 font-semibold">Grade: {DB.getGrades().find(g => g.id === currentLearner.gradeId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-450 uppercase font-bold">Payer / Guardian details</p>
                    <p className="font-extrabold text-slate-900 mt-1">{currentParent?.name || 'N/A'}</p>
                    <p className="text-slate-500 font-semibold mt-0.5">Relationship: {currentParent?.relationship || 'Parent'}</p>
                    <p className="text-slate-500 font-semibold">Contact: {currentParent?.contactNumber}</p>
                  </div>
                </div>

                {/* 3. Breakdown pricing structure block */}
                <div className="space-y-2 text-xs">
                  <div className="border-b border-slate-100 pb-1.5 flex justify-between uppercase text-[10px] font-extrabold tracking-wider text-slate-400">
                    <span>Transaction Description</span>
                    <span className="text-right">Tally Cost</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] py-1">
                    <div>
                      <h5 className="font-bold text-slate-800">School Fees Payment</h5>
                      <p className="text-[9px] text-slate-450">Payment reference: {currentPay.reference}</p>
                      {currentPay.note && <p className="text-[9px] text-brand-blue font-semibold mt-0.5">Note: {currentPay.note}</p>}
                    </div>
                    <span className="font-black font-mono text-slate-800">
                      R {currentPay.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Deduct sums overall spacing */}
                  <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[10px] text-slate-500">
                    <div className="flex justify-between font-semibold">
                      <span>Subtotal Payment Allocation:</span>
                      <span className="font-mono text-slate-800">R {currentPay.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-xs text-slate-800 dark:text-black border-t border-slate-100 pt-1.5">
                      <span>TOTAL FUNDS CREDITED (ZAR):</span>
                      <span className="font-black font-mono text-brand-blue">R {currentPay.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Verifiers signature block and SVG QR code */}
                <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Received by Cashier:</span>
                      <span className="font-bold text-slate-700">{currentBursar?.name || 'Sarah Botha (Bursar)'}</span>
                    </div>
                    <div className="h-8 border-b border-slate-300 w-32 border-slate-300"></div>
                    <span className="block text-[8px] uppercase font-bold tracking-widest text-slate-400">OFFICIAL BURSAR SIGNATURE</span>
                  </div>

                  {/* SYSTEM QR CODE / BARCODE SVG */}
                  <div className="flex flex-col items-center">
                    <svg className="h-14 w-14 border border-slate-200 rounded p-1 bg-white select-none" viewBox="0 0 24 24">
                      {/* Generates a sophisticated mock barcode or QR code grid representation */}
                      <path fill="black" d="M2 2h4v4H2zm1 1v2h2V3zm11-1h4v4h-4zm1 1v2h2V3zm-11 11h4v4H2zm1 1v2h2v-2zm12-1v2h2v-2zm-3 3h2v2h-2zm3 0h2v2h-2zm-3-3h2v2h-2zm0-4h2v2h-2zm2 2h2v2h-2zm1-2h2v2h-2zm-3-5h2v2h-2zm-3 3h2v2h-2zm-3-3h2v2H6zm0 10h2v2H6zm3 3h2v2H9zm3-3h2v2h-2z" />
                    </svg>
                    <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-wider">SECURE PAY VERIFY</span>
                  </div>
                </div>

                <div className="text-center text-[8px] text-slate-450 leading-tight border-t border-slate-100 pt-3">
                  <p>Thank you for choosing Blooming Kids. This voucher acts as direct system proof of settlement.</p>
                  <p className="font-bold text-brand-red mt-0.5 select-none text-[7px]">Blooming Kids ECD • Registered Grade Facility Durban</p>
                </div>

              </div>
            </>
          )
        ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <Printer className="h-8 w-8 text-slate-400 mb-2 stroke-1" />
              <span>Please pick a historical receipt of the registry list on the left to preview its printable receipt statement.</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

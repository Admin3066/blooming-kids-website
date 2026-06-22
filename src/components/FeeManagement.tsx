import React, { useState } from 'react';
import { 
  Coins, Landmark, Plus, Trash2, Tag, Percent, Receipt, ChevronRight, FileText, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { DB } from '../db/storage';
import { Learner, Grade, FeeItem, DiscountExemption, AdditionalCharge, Payment, Parent } from '../types';

interface FeeMgmtProps {
  onNavigate: (view: string, targetId?: string) => void;
  currentUserRole: string;
}

export default function FeeManagement({ onNavigate, currentUserRole }: FeeMgmtProps) {
  const isViewOnly = currentUserRole === 'Teacher (view only)';

  // Lists from DB
  const [grades] = useState<Grade[]>(() => DB.getGrades());
  const [learners, setLearners] = useState<Learner[]>(() => DB.getLearners());
  const [feeItems, setFeeItems] = useState<FeeItem[]>(() => DB.getFeeItems());
  const [discounts, setDiscounts] = useState<DiscountExemption[]>(() => DB.getDiscounts());
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(() => DB.getAdditionalCharges());

  // Workspace sub-tabs: 1. Record Payment, 2. Global Fee Structures, 3. Adjust Student Accounts (Discounts & Extra charges)
  const [activeSubTab, setActiveSubTab] = useState<'record' | 'structure' | 'adjustments'>('record');

  // WORKSPACE 1: RECORD PAYMENT
  const [payLearnerId, setPayLearnerId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'EFT' | 'Credit/Debit Card' | 'Direct Deposit'>('EFT');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [payError, setPayError] = useState('');
  const [createdReceiptNumber, setCreatedReceiptNumber] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // WORKSPACE 2: GLOBAL FEE STRUCTURE
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState('');
  const [newFeeGradeId, setNewFeeGradeId] = useState('all');
  const [newFeeType, setNewFeeType] = useState<'Required' | 'Optional'>('Required');
  const [newFeePeriod, setNewFeePeriod] = useState<'Annual' | 'Termly' | 'Monthly' | 'Once-off'>('Annual');
  const [feeSuccess, setFeeSuccess] = useState('');
  const [feeError, setFeeError] = useState('');

  // WORKSPACE 3: ADJUSTMENTS (Discounts & Charges)
  const [adjLearnerId, setAdjLearnerId] = useState('');
  const [adjType, setAdjType] = useState<'discount' | 'charge'>('charge');
  const [adjName, setAdjName] = useState(''); // e.g., Siblings Relief, Uniform set
  const [adjAmount, setAdjAmount] = useState('');

  const refreshAllState = () => {
    setLearners(DB.getLearners());
    setFeeItems(DB.getFeeItems());
    setDiscounts(DB.getDiscounts());
    setAdditionalCharges(DB.getAdditionalCharges());
  };

  // Generate clear system receipts (REC-YYYY-NNNN)
  const getNextReceiptNumber = () => {
    const currentYear = new Date().getFullYear();
    const receipts = DB.getReceipts();
    const prefix = `REC-${currentYear}-`;
    
    const matchingReceipts = receipts.filter(r => r.receiptNumber.startsWith(prefix));
    if (matchingReceipts.length > 0) {
      // Sort to get largest
      const sorted = [...matchingReceipts].sort((a,b) => b.receiptNumber.localeCompare(a.receiptNumber));
      const lastNumPart = sorted[0].receiptNumber.split('-')[2];
      const parsed = parseInt(lastNumPart, 10);
      if (!isNaN(parsed)) {
        return `${prefix}${String(parsed + 1).padStart(4, '0')}`;
      }
    }
    return `${prefix}0006`;
  };

  // 1. Transaction trigger: Record payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    setPaySuccess('');
    setPayError('');

    if (!payLearnerId) {
      setPayError('Please pick a learner of the active system.');
      return;
    }

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError('Please write a clean positive numerical amount.');
      return;
    }

    const statement = DB.getLearnerStatement(payLearnerId);
    if (!statement) {
      setPayError('Learner profile lookup failed.');
      return;
    }

    // Safety checks: let user pay partial or full. Allow brief overpayment if necessary but warn
    try {
      const nextReceiptNum = getNextReceiptNumber();
      const currentUser = DB.getCurrentUser();
      
      let finalPaymentDate = new Date().toISOString();
      if (payDate) {
        const parsedDate = new Date(payDate);
        if (!isNaN(parsedDate.getTime())) {
          // Set to noon local to avoid timezone drift (day shift) when stringifying or printing
          parsedDate.setHours(12, 0, 0, 0);
          finalPaymentDate = parsedDate.toISOString();
        }
      }

      const paymentsList = DB.getPayments();
      const cleanPayment: Payment = {
        id: DB.generateId(),
        learnerId: payLearnerId,
        amount: amountNum,
        paymentDate: finalPaymentDate,
        paymentMethod: payMethod,
        reference: payRef || 'N/A',
        receivedByUserId: currentUser?.id || 'system',
        receiptNumber: nextReceiptNum,
        note: payNote
      };

      paymentsList.push(cleanPayment);
      DB.savePayments(paymentsList);

      // Generate receipt
      const receiptsList = DB.getReceipts();
      const cleanReceipt = {
        id: DB.generateId(),
        receiptNumber: nextReceiptNum,
        paymentId: cleanPayment.id,
        learnerId: payLearnerId,
        dateGenerated: cleanPayment.paymentDate,
        qrCodeValue: `VERIFY:BLOOMINGKIDS:${nextReceiptNum}:R${amountNum}`,
        printedCount: 0
      };
      receiptsList.push(cleanReceipt);
      DB.saveReceipts(receiptsList);

      DB.log('Record Payment', `Recorded R ${amountNum.toLocaleString()} payment for ${statement.learner.name}. Rec: ${nextReceiptNum}`);
      
      // Success feedback
      setCreatedReceiptNumber(nextReceiptNum);
      setPaySuccess(`Successfully recorded payment of R ${amountNum.toLocaleString()} for "${statement.learner.name}". Relational Receipt Generated!`);
      
      // Clear inputs
      setPayAmount('');
      setPayRef('');
      setPayNote('');
      refreshAllState();
    } catch (e: any) {
      setPayError(`Bursar transactional failure: ${e.message}`);
    }
  };

  // 2. Add New Fee Structure Item
  const handleAddFeeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    setFeeSuccess('');
    setFeeError('');

    if (!newFeeName.trim()) {
      setFeeError('Please enter a valid fee name/label.');
      return;
    }

    const parsedAmount = parseFloat(newFeeAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setFeeError('Please specify a positive numerical fee cost.');
      return;
    }

    try {
      const items = DB.getFeeItems();
      const newItem: FeeItem = {
        id: DB.generateId(),
        gradeId: newFeeGradeId,
        name: newFeeName.trim(),
        amount: parsedAmount,
        type: newFeeType,
        period: newFeePeriod
      };

      items.push(newItem);
      DB.saveFeeItems(items);
      DB.log('Add Fee Item', `Created new fee structure: ${newItem.name} (R ${parsedAmount})`);
      
      setFeeSuccess(`Successfully added local & database synchronized fee: "${newItem.name}"`);
      setNewFeeName('');
      setNewFeeAmount('');
      refreshAllState();
    } catch (err: any) {
      setFeeError(`Bursar setup error: ${err.message}`);
    }
  };

  const applyPreset = (preset: { name: string; amount: number; type: 'Required' | 'Optional'; period: 'Annual' | 'Termly' | 'Monthly' | 'Once-off' }) => {
    setNewFeeName(preset.name);
    setNewFeeAmount(preset.amount.toString());
    setNewFeeType(preset.type);
    setNewFeePeriod(preset.period);
    setFeeSuccess(`Loaded standard tariff template: "${preset.name}". Adjust grade match and save.`);
    setFeeError('');
  };

  const handleDeleteFeeItem = (id: string) => {
    if (isViewOnly) return;
    // Protect system defaults
    if (['f1', 'f3', 'f4', 'f5'].includes(id)) {
      alert('This is a core system required fee. Deletion restricted to protect history ledger integrity.');
      return;
    }

    const items = DB.getFeeItems();
    const item = items.find(i => i.id === id);
    const filtered = items.filter(i => i.id !== id);
    DB.saveFeeItems(filtered);
    DB.log('Delete Fee Item', `Removed Fee config item: ${item?.name}`);
    refreshAllState();
  };

  // 3. Add Accounts adjust (Discount Exemptions / Special Chargers)
  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    if (!adjLearnerId || !adjName || !adjAmount) return;

    const amountNum = parseFloat(adjAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const student = learners.find(l => l.id === adjLearnerId);
    if (!student) return;

    if (adjType === 'discount') {
      const discountList = DB.getDiscounts();
      const newDiscount: DiscountExemption = {
        id: DB.generateId(),
        learnerId: adjLearnerId,
        name: adjName,
        amount: amountNum,
        type: 'Discount'
      };
      discountList.push(newDiscount);
      DB.saveDiscounts(discountList);
      DB.log('Apply Discount', `Applied R ${amountNum} Discount/Exemption to student: ${student.name}`);
    } else {
      const chargeList = DB.getAdditionalCharges();
      const newCharge: AdditionalCharge = {
        id: DB.generateId(),
        learnerId: adjLearnerId,
        name: adjName,
        amount: amountNum,
        dateCharged: new Date().toISOString().split('T')[0]
      };
      chargeList.push(newCharge);
      DB.saveAdditionalCharges(chargeList);
      DB.log('Apply Additional Charge', `Applied R ${amountNum} Extra Charge (${adjName}) to student: ${student.name}`);
    }

    setAdjName('');
    setAdjAmount('');
    refreshAllState();
  };

  const handleClearAdjustment = (id: string, type: 'discount' | 'charge') => {
    if (isViewOnly) return;
    if (type === 'discount') {
      const filtered = discounts.filter(d => d.id !== id);
      DB.saveDiscounts(filtered);
    } else {
      const filtered = additionalCharges.filter(c => c.id !== id);
      DB.saveAdditionalCharges(filtered);
    }
    DB.log('Clear Adjustment', `Cleared account adjustment reference.`);
    refreshAllState();
  };

  // Live calculation panel for the selected recording learner
  const activeStatement = payLearnerId ? DB.getLearnerStatement(payLearnerId) : null;

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Bursary Operations Center</h2>
        <p className="text-xs text-slate-500">Record parent payments, define annual school pricing, and allocate exemptions</p>
      </div>

      {/* HORIZONTAL WORKSPACE TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        <button
          onClick={() => setActiveSubTab('record')}
          className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${activeSubTab === 'record' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-805'}`}
        >
          Record Fee Payments
        </button>
        <button
          onClick={() => setActiveSubTab('structure')}
          className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${activeSubTab === 'structure' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-805'}`}
        >
          Grade Pricing & Fees Structure
        </button>
        <button
          onClick={() => setActiveSubTab('adjustments')}
          className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 transition ${activeSubTab === 'adjustments' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-805'}`}
        >
          Manual Extra Charges & Discounts
        </button>
      </div>

      {/* TAB 1 CONTENT: RECORD PAYMENTS */}
      {activeSubTab === 'record' && (
        <div className="grid gap-6 md:grid-cols-5">
          
          {/* REGISTERED BILLING FORM */}
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 h-fit">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Record Parent Payment</h3>
            
            {paySuccess && (
              <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-850 space-y-2 dark:bg-emerald-950/20 dark:text-emerald-400">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{paySuccess}</span>
                </div>
                <div className="flex gap-2 pt-1 border-t border-emerald-100">
                  <button 
                    onClick={() => onNavigate('receipts')}
                    className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1 rounded hover:bg-emerald-750"
                  >
                    Reprint Receipt
                  </button>
                  <button 
                    onClick={() => { setPaySuccess(''); setPayLearnerId(''); }}
                    className="text-[10px] text-slate-505 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {payError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 text-brand-red shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            {isViewOnly ? (
              <p className="text-xs text-brand-red font-semibold p-4 bg-slate-50 dark:bg-slate-800 rounded">
                Authorization Alert: Quick-view users cannot modify transactional accounting ledgers.
              </p>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Pick Student Profile</label>
                  <select
                    value={payLearnerId}
                    onChange={(e) => { setPayLearnerId(e.target.value); setPaySuccess(''); }}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Choose Learner --</option>
                    {learners.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.admissionNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Amount Settled (ZAR)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 font-bold">R</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-6 pr-2 text-slate-900 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e: any) => setPayMethod(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 focus:outline-none"
                    >
                      <option value="EFT">Electronic Transfer (EFT)</option>
                      <option value="Cash">Cash Deposit</option>
                      <option value="Credit/Debit Card">Card Payment</option>
                      <option value="Direct Deposit">Standard Over-Counter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Payment Date (Billing Period)</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                  />
                  
                  <div className="mt-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded border border-slate-150 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Quick Monthly Allocation Shortcut (2026 school term)</span>
                    <div className="grid grid-cols-6 gap-1">
                      {[
                        { label: 'Jan', m: 0 }, { label: 'Feb', m: 1 }, { label: 'Mar', m: 2 }, 
                        { label: 'Apr', m: 3 }, { label: 'May', m: 4 }, { label: 'Jun', m: 5 }, 
                        { label: 'Jul', m: 6 }, { label: 'Aug', m: 7 }, { label: 'Sep', m: 8 }, 
                        { label: 'Oct', m: 9 }, { label: 'Nov', m: 10 }, { label: 'Dec', m: 11 }
                      ].map((item) => {
                        const yr = new Date().getFullYear();
                        const isSelected = payDate && new Date(payDate).getMonth() === item.m && new Date(payDate).getFullYear() === yr;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              const d = new Date(yr, item.m, 15);
                              setPayDate(d.toISOString().split('T')[0]);
                            }}
                            className={`py-1 text-[10px] rounded text-center font-semibold transition cursor-pointer select-none ${
                              isSelected 
                                ? 'bg-brand-blue text-white shadow-xs' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Reference / Bank Narration</label>
                  <input
                    type="text"
                    required={payMethod !== 'Cash'}
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                    placeholder="e.g. FNB Dep ref, Card trace"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Statement Comments (Internal notes)</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                    placeholder="e.g. Paid in full, term installment"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-brand-blue text-white py-2 px-4 shadow font-bold hover:bg-brand-blue/90 flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <Coins className="h-4 w-4" />
                  Confirm & Write payment
                </button>
              </form>
            )}
          </div>

          {/* DYNAMIC RELATIONAL LEDGER STATUS PREVIEW */}
          <div className="md:col-span-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Student Finance Statement Overview</h3>
            
            {activeStatement ? (
              <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
                
                {/* 1. Quick Info Header and balance tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-850 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Charged</span>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">R {activeStatement.totalCharged.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Discounts Applied</span>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 text-teal-600">-R {activeStatement.totalDiscounts.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Settled</span>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 text-emerald-600">R {activeStatement.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Arrears Balance</span>
                    <p className="font-extrabold text-sm text-brand-red">
                      R {activeStatement.outstandingBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 2. Structured checklist of fee calculations */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-450">Active Account Adjustments</h4>
                  
                  {/* Discounts list */}
                  <div className="space-y-1">
                    {activeStatement.discounts.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/40 rounded">
                        <span className="font-medium text-[11px] text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
                          <Tag className="h-3 w-3" />
                          {d.name} ({d.type})
                        </span>
                        <span className="font-bold text-teal-800 dark:text-teal-400">-R {d.amount}</span>
                      </div>
                    ))}

                    {/* Additional Charges and manual items */}
                    {activeStatement.extraCharges.map(ch => (
                      <div key={ch.id} className="flex items-center justify-between p-2 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/40 rounded">
                        <span className="font-medium text-[11px] text-orange-850 dark:text-orange-400 flex items-center gap-1.5">
                          <Plus className="h-3 w-3" />
                          {ch.name}
                        </span>
                        <span className="font-bold text-orange-800 dark:text-orange-405">R {ch.amount}</span>
                      </div>
                    ))}

                    {activeStatement.discounts.length === 0 && activeStatement.extraCharges.length === 0 && (
                      <p className="text-[10px] text-slate-400 py-2.5 text-center bg-slate-50/40 dark:bg-slate-800 rounded">No discounts or additional specific items applied yet.</p>
                    )}
                  </div>
                </div>

                {/* 3. Link triggers */}
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => onNavigate('statements', payLearnerId)}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-blue font-bold px-2 py-1 rounded bg-brand-blue/5 hover:bg-brand-blue/15"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    A4 Fee Statement
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Select a registered child in the dropdown menu to fetch their active bills ledger.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2 CONTENT: GLOBAL FEE STAKES */}
      {activeSubTab === 'structure' && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* New Setup Parameter */}
          <div className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 h-fit space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Add Global Fee Parameter</h3>
            
            {feeSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-850 flex items-center gap-2 dark:bg-emerald-950/20 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{feeSuccess}</span>
              </div>
            )}

            {feeError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 text-brand-red shrink-0" />
                <span>{feeError}</span>
              </div>
            )}

            {isViewOnly ? (
              <p className="text-xs text-brand-red font-semibold p-4 bg-slate-50 dark:bg-slate-850 rounded">
                Account locked: Viewer modes cannot modify school-wide global pricing rates.
              </p>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleAddFeeItem} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-550 font-semibold mb-1">Fee Item Label</label>
                    <input
                      type="text"
                      required
                      value={newFeeName}
                      onChange={(e) => setNewFeeName(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
                      placeholder="e.g. Uniform Set, Mid-Year Exams"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-550 font-semibold mb-1">Pricing (Rands)</label>
                      <input
                        type="number"
                        required
                        value={newFeeAmount}
                        onChange={(e) => setNewFeeAmount(e.target.value)}
                        className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
                        placeholder="e.g. 1500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-550 font-semibold mb-1">Grade Level Match</label>
                      <select
                        value={newFeeGradeId}
                        onChange={(e) => setNewFeeGradeId(e.target.value)}
                        className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-805 px-3 py-1.5 focus:outline-none"
                      >
                        <option value="all">All Grades</option>
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>{g.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-550 font-semibold mb-1">Requirement</label>
                      <select
                        value={newFeeType}
                        onChange={(e: any) => setNewFeeType(e.target.value)}
                        className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-855 px-3 py-1.5 focus:outline-none"
                      >
                        <option value="Required">Required Charge</option>
                        <option value="Optional">Optional Addon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-550 font-semibold mb-1">Periodicity</label>
                      <select
                        value={newFeePeriod}
                        onChange={(e: any) => setNewFeePeriod(e.target.value)}
                        className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-855 px-3 py-1.5 focus:outline-none"
                      >
                        <option value="Annual">Annual (Yearly)</option>
                        <option value="Termly">Term Termly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Once-off">Once-off payment</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded bg-brand-blue text-white py-2 px-3 shadow font-bold hover:bg-brand-blue/90 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Save Global pricing Fee
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-2">Preset Quick Templates</h4>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => applyPreset({ name: 'Grade Tuition Fee', amount: 4800, type: 'Required', period: 'Annual' })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer font-medium"
                    >
                      🎓 Tuition Fee (Annual)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ name: 'Stationery & Supply Pack', amount: 1250, type: 'Required', period: 'Annual' })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer font-medium"
                    >
                      ✏️ Stationery Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ name: 'Daily Bus Transport service', amount: 750, type: 'Optional', period: 'Monthly' })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer font-medium"
                    >
                      🚌 Transport Service
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ name: 'Branded Uniform Set', amount: 950, type: 'Optional', period: 'Once-off' })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer font-medium"
                    >
                      👕 Uniform Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ name: 'Healthy School Meals Scheme', amount: 600, type: 'Optional', period: 'Monthly' })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-855 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer font-medium"
                    >
                      🍎 Nutritional Catering
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ name: 'School Excursion Field Trip', amount: 450, type: 'Optional', period: 'Once-off' })}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-855 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer font-medium"
                    >
                      🎡 Field Trip Outing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE PARAMETERS PRICING TABLE */}
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Active Pricing Structures Matrix</h3>
            
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3">Fee Label</th>
                    <th className="p-3">Grade Bracket</th>
                    <th className="p-3">Requirement</th>
                    <th className="p-3 text-right">Cost (ZAR)</th>
                    {!isViewOnly && <th className="p-3 text-center">Manage</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {feeItems.map(item => {
                    const gr = grades.find(g => g.id === item.gradeId);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.period}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-500 uppercase">{item.gradeId === 'all' ? 'Universal' : gr?.code}</td>
                        <td className="p-3">
                          <span className={`inline-block font-semibold uppercase text-[9px] px-2 py-0.5 rounded ${item.type === 'Required' ? 'bg-indigo-50 text-brand-blue dark:bg-indigo-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">R {item.amount.toLocaleString()}</td>
                        {!isViewOnly && (
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteFeeItem(item.id)}
                              className="text-slate-400 hover:text-brand-red"
                              title="Delete Fee Config"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3 CONTENT: MANUAL STUDENT-LEVEL ADJUSTMENTS */}
      {activeSubTab === 'adjustments' && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* New Setup form */}
          <div className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850 h-fit">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Issue Charge / Exemption</h3>
            
            {isViewOnly ? (
              <p className="text-xs text-brand-red font-semibold p-4 bg-slate-50 dark:bg-slate-850 rounded">
                Action locked: Quick view users are restricted from allocating exemptions or debiting extra student balance charges.
              </p>
            ) : (
              <form onSubmit={handleAddAdjustment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Choose Learner Profile</label>
                  <select
                    value={adjLearnerId}
                    onChange={(e) => setAdjLearnerId(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
                  >
                    <option value="">-- Choose Learner --</option>
                    {learners.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.admissionNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Adjustment Action Category</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setAdjType('charge')}
                      className={`py-1 rounded text-center text-[11px] font-bold cursor-pointer ${adjType === 'charge' ? 'bg-white shadow text-slate-800 dark:bg-slate-705' : 'text-slate-505'}`}
                    >
                      Debit Extra Charge
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjType('discount')}
                      className={`py-1 rounded text-center text-[11px] font-bold cursor-pointer ${adjType === 'discount' ? 'bg-white shadow text-slate-800 dark:bg-slate-705' : 'text-slate-505'}`}
                    >
                      Exempt / Discount
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Description / Narration</label>
                  <input
                    type="text"
                    required
                    value={adjName}
                    onChange={(e) => setAdjName(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
                    placeholder={adjType === 'discount' ? 'e.g. Sibling Exemption, Scholarship' : 'e.g. Classroom Outing June, Replacement bag'}
                  />
                </div>

                <div>
                  <label className="block text-slate-550 font-semibold mb-1">Amount Value (ZAR Rands)</label>
                  <input
                    type="number"
                    required
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded bg-brand-blue text-white py-2 px-3 shadow font-bold hover:bg-brand-blue/90"
                >
                  Allocate Account Adjustment
                </button>
              </form>
            )}
          </div>

          {/* ACTIVE LEDGER ADJUSTMENTS LIST */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Active Discounts Exemption Panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Issued Student Exemptions & Sibling Discounts</h3>
              
              <div className="overflow-x-auto text-xs">
                {discounts.length === 0 ? (
                  <p className="text-center py-6 text-slate-400">No student active accounts writeoffs allocated.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                      <tr>
                        <th className="p-2">Student</th>
                        <th className="p-2">Arrears Deduction Details</th>
                        <th className="p-2 text-right">Value (ZAR)</th>
                        {!isViewOnly && <th className="p-2 text-center">Manage</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {discounts.map(d => {
                        const s = learners.find(l => l.id === d.learnerId);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50/50">
                            <td className="p-2 font-bold text-slate-900 dark:text-white">{s?.name || 'Unknown'}</td>
                            <td className="p-2 font-medium text-teal-600">{d.name}</td>
                            <td className="p-2 text-right font-extrabold text-teal-500">-R {d.amount.toLocaleString()}</td>
                            {!isViewOnly && (
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => handleClearAdjustment(d.id, 'discount')}
                                  className="text-slate-300 hover:text-brand-red"
                                  title="Clear Allocation"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Active Manual extra charges panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:bg-slate-900 dark:border-slate-850">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Issued Manual Extra Charges Ledger</h3>
              
              <div className="overflow-x-auto text-xs font-medium">
                {additionalCharges.length === 0 ? (
                  <p className="text-center py-6 text-slate-400">No individual customized charges issued yet.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                      <tr>
                        <th className="p-2">Student</th>
                        <th className="p-2">Charge details</th>
                        <th className="p-2">Date Billing</th>
                        <th className="p-2 text-right">Cost (ZAR)</th>
                        {!isViewOnly && <th className="p-2 text-center">Manage</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {additionalCharges.map(ch => {
                        const s = learners.find(l => l.id === ch.learnerId);
                        return (
                          <tr key={ch.id} className="hover:bg-slate-50/50">
                            <td className="p-2 font-bold text-slate-900 dark:text-white">{s?.name || 'Unknown'}</td>
                            <td className="p-2">{ch.name}</td>
                            <td className="p-2 text-slate-400">{ch.dateCharged}</td>
                            <td className="p-2 text-right font-extrabold text-slate-800 dark:text-slate-150">R {ch.amount.toLocaleString()}</td>
                            {!isViewOnly && (
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => handleClearAdjustment(ch.id, 'charge')}
                                  className="text-slate-300 hover:text-brand-red"
                                  title="Clear Charge"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
